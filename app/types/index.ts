export type { RoleScopedChatInput } from '@cloudflare/workers-types'

// typescript didn't narrow so had to specify undefined for all properties which existed somewhere in the union

export type QueryStreamResponse = {
  message: 'Rewriting message to queries...'

  queries: undefined
  relevantContext: undefined
  response: undefined
  p: undefined
  error: undefined
} | {
  message: 'Querying vector index and full text search...'
  queries: string[]

  relevantContext: undefined
  response: undefined
  p: undefined
  error: undefined
} | {
  message: 'Found relevant documents, generating response...'
  relevantContext: { text: string }[]

  queries: undefined
  response: undefined
  p: undefined
  error: undefined
} | {
  response: string
  p: string

  message: undefined
  error: undefined
  queries: undefined
  relevantContext: undefined
} | {
  message: string

  queries: undefined
  relevantContext: undefined
  response: undefined
  p: undefined
  error: undefined
} | {
  error: string

  message: undefined
  queries: undefined
  relevantContext: undefined
  response: undefined
  p: undefined
}

export type UploadStreamResponse = {
  message: string // Embedding... (0.00%)
  progress: number

  chunks: undefined
  error: undefined
} | {
  message: 'Extracted text from PDF'

  progress: undefined
  chunks: undefined
  error: undefined
} | {
  message: 'Split text into chunks'

  progress: undefined
  chunks: undefined
  error: undefined
} | {
  message: 'Inserted vectors'
  chunks: number

  error: undefined
} | {
  error: string

  message: undefined
  progress: undefined
  chunks: undefined
}

export interface Document {
  name: string
  size: number
  chunks: number | null
  progress?: string
}
