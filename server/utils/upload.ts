import { getDocumentProxy, extractText } from 'unpdf'

export async function extractTextFromPDF(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const result = await extractText(pdf, { mergePages: true })
  return Array.isArray(result.text) ? result.text.join(' ') : result.text
}

export async function uploadPDF(file: File, sessionId: string): Promise<string> {
  const blob = await hubBlob().put(`${Date.now()}-${file.name}`, file, { prefix: sessionId })
  return blob.pathname
}

export async function insertDocument(file: File, textContent: string, sessionId: string, r2Url: string) {
  const row = {
    name: file.name,
    size: file.size,
    textContent,
    sessionId,
    r2Url,
  }

  return useDrizzle().insert(tables.documents).values(row).returning({ insertedId: tables.documents.id })
}

export async function processVectors(
  chunks: string[],
  sessionId: string,
  documentId: string,
  streamResponse: (message: object) => Promise<void>,
) {
  const chunkSize = 10
  let progress = 0

  await Promise.all(
    Array.from({ length: Math.ceil(chunks.length / chunkSize) }, async (_, index) => {
      const start = index * chunkSize
      const chunkBatch = chunks.slice(start, start + chunkSize)

      // Generate embeddings for the current batch
      const embeddingResult = await hubAI().run('@cf/baai/bge-large-en-v1.5', {
        text: chunkBatch,
      })
      const embeddingBatch: number[][] = embeddingResult.data

      // Insert chunks into the database
      const chunkInsertResults = await useDrizzle()
        .insert(tables.documentChunks)
        .values(
          chunkBatch.map(chunk => ({
            text: chunk,
            sessionId,
            documentId,
          })),
        )
        .returning({ insertedChunkId: tables.documentChunks.id })

      // Extract the inserted chunk IDs
      const chunkIds = chunkInsertResults.map(result => result.insertedChunkId)

      // Insert vectors into Vectorize index
      await hubVectorize('documents').insert(
        embeddingBatch.map((embedding, i) => ({
          id: chunkIds[i],
          values: embedding,
          namespace: 'default',
          metadata: { sessionId, documentId, chunkId: chunkIds[i], text: chunkBatch[i] },
        })),
      )

      progress += (chunkBatch.length / chunks.length) * 100
      await streamResponse({
        message: `Embedding... (${progress.toFixed(2)}%)`,
        progress,
      })
    }),
  )
}
