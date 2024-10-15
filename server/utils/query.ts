import type { RoleScopedChatInput } from '@cloudflare/workers-types'
import { inArray, sql } from 'drizzle-orm'

async function rewriteToQueries(content: string): Promise<string[]> {
  const prompt = `Given the following user message, rewrite it into 5 distinct queries that could be used to search for relevant information. Each query should focus on different aspects or potential interpretations of the original message. No questions, just a query maximizing the chance of finding relevant information.

User message: "${content}"

Provide 5 queries, one per line and nothing else:`

  const { response } = await hubAI().run('@cf/meta/llama-3.1-8b-instruct', { prompt }) as { response: string }

  const regex = /^\d+\.\s*"|"$/gm
  const queries = response
    .replace(regex, '')
    .split('\n')
    .filter(query => query.trim() !== '')
    .slice(1, 5)

  return queries
}

type DocumentChunkResult = DocumentChunk & { rank: number }

async function searchDocumentChunks(searchTerms: string[]) {
  const queries = searchTerms.filter(Boolean).map(
    (term) => {
      const sanitizedTerm = term.trim().replace(/[^\w\s]/g, '')
      return sql`
        SELECT document_chunks.*, document_chunks_fts.rank
        FROM document_chunks_fts
        JOIN document_chunks ON document_chunks_fts.id = document_chunks.id
        WHERE document_chunks_fts MATCH ${sanitizedTerm}
        ORDER BY rank DESC
        LIMIT 5
      `
    },
  )

  const results = await Promise.all(
    queries.map(async (query) => {
      const { results } = (await useDrizzle().run(query)) as { results: DocumentChunkResult[] }
      return results
    }),
  )

  return results
    .flat()
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 10)
}

// Helper function to perform reciprocal rank fusion
function performReciprocalRankFusion(
  fullTextResults: DocumentChunk[],
  vectorResults: VectorizeMatches[],
): { id: string, score: number }[] {
  const k = 60 // Constant for fusion, can be adjusted
  const scores: { [id: string]: number } = {}

  // Process full-text search results
  fullTextResults.forEach((result, index) => {
    const score = 1 / (k + index)
    scores[result.id] = (scores[result.id] || 0) + score
  })

  // Process vector search results
  vectorResults.forEach((result) => {
    result.matches.forEach((match, index) => {
      const score = 1 / (k + index)
      scores[match.id] = (scores[match.id] || 0) + score
    })
  })

  // Sort and return fused results
  return Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score)
}

const SYSTEM_MESSAGE = `You are a helpful assistant that answers questions based on the provided context. When giving a response, always include the source of the information in the format [1], [2], [3] etc.`

async function queryVectorIndex(queries: string[], sessionId: string) {
  const queryVectors = await Promise.all(
    queries.map(q => hubAI().run('@cf/baai/bge-large-en-v1.5', { text: [q] })),
  )

  const allResults = await Promise.all(
    queryVectors.map(qv =>
      hubVectorize('documents').query(qv.data[0], {
        topK: 5,
        returnValues: true,
        returnMetadata: 'all',
        namespace: 'default',
        filter: {
          sessionId,
        },
      }),
    ),
  )

  return allResults
}

async function getRelevantDocuments(ids: string[]) {
  const relevantDocs = await useDrizzle()
    .select({ text: tables.documentChunks.text })
    .from(tables.documentChunks)
    .where(inArray(tables.documentChunks.id, ids))

  return relevantDocs
}

export async function processUserQuery({ sessionId, messages }: { sessionId: string, messages: RoleScopedChatInput[] }, streamResponse: (message: object) => Promise<void>) {
  messages.unshift({ role: 'system', content: SYSTEM_MESSAGE })
  const lastMessage = messages[messages.length - 1]
  const query = lastMessage.content

  await streamResponse({ message: 'Rewriting message to queries...' })

  const queries = await rewriteToQueries(query)
  const queryingVectorIndexMsg = {
    message: 'Querying vector index and full text search...',
    queries,
  }
  await streamResponse(queryingVectorIndexMsg)

  const [fullTextSearchResults, vectorIndexResults] = await Promise.all([
    searchDocumentChunks(queries),
    queryVectorIndex(queries, sessionId),
  ])

  // Perform reciprocal rank fusion on fullTextSearchResults and vectorIndexResults
  // Sort in descending order because higher scores are better in reciprocal rank fusion
  const mergedResults = performReciprocalRankFusion(fullTextSearchResults, vectorIndexResults).sort(
    (a, b) => b.score - a.score,
  )

  const relevantDocs = await getRelevantDocuments(mergedResults.map(r => r.id).slice(0, 10))

  const relevantTexts = relevantDocs
    .map((doc, index) => `[${index + 1}]: ${doc.text}`)
    .join('\n\n')

  const relevantDocsMsg = {
    message: 'Found relevant documents, generating response...',
    relevantContext: relevantDocs,
    queries,
  }
  await streamResponse(relevantDocsMsg)

  messages.push({
    role: 'assistant',
    content: `The following queries were made:\n${queries.join(
      '\n',
    )}\n\nRelevant context from attached documents:\n${relevantTexts}`,
  })

  return { messages }
}
