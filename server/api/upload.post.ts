// original: https://github.com/RafalWilinski/cloudflare-rag/blob/2f4341bcf462c8f86001b601e59e60c25b1a6ea8/functions/api/upload.ts

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const sessionId = formData.get('sessionId') as string
  const file = formData.get('file') as File

  if (!sessionId) throw createError({ statusCode: 400, message: 'Missing sessionId' })
  if (!file || !file.size) throw createError({ statusCode: 400, message: 'No file provided' })
  ensureBlob(file, { maxSize: '8MB', types: ['application/pdf'] })

  // prevent uploading files to example sessions
  const exampleSessionIds = useExampleSessions()
  if (exampleSessionIds.some(({ id }) => id === sessionId)) {
    throw createError({ statusCode: 400, message: 'File uploading unavailable on example sessions' })
  }

  // create stream and return it
  const eventStream = createEventStream(event)
  const streamResponse = (data: object) => eventStream.push(JSON.stringify(data))

  // prevent worker from being killed while processing
  event.waitUntil((async () => {
    try {
      // upload file, extract text, and insert document
      const [r2Url, textContent] = await Promise.all([
        uploadPDF(file, sessionId),
        extractTextFromPDF(file),
      ])
      await streamResponse({ message: 'Extracted text from PDF' })

      const insertResult = await insertDocument(file, textContent, sessionId, r2Url)
      const documentId = insertResult[0].insertedId

      // split text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
      })
      const chunks = await splitter.splitText(textContent)
      await streamResponse({ message: 'Split text into chunks' })

      // generate and store vectors for each chunk
      await processVectors(chunks, sessionId, documentId, streamResponse)
      await streamResponse({ message: 'Inserted vectors', chunks: chunks.length })
    }
    catch (error) {
      await streamResponse({ error: (error as Error).message })
    }
    finally {
      eventStream.close()
    }
  })())

  return eventStream.send()
})
