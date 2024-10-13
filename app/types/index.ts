export type { RoleScopedChatInput } from '@cloudflare/workers-types'

export type QueryStreamResponse = {
  message: 'Rewriting message to queries...'
  response: undefined
} | {
  message: 'Querying vector index and full text search...'
  queries: string[]
  response: undefined
} | {
  message: 'Found relevant documents, generating response...'
  relevantContext: { text: string }[]
  response: undefined
} | {
  response: string
  p: string
  message: undefined
}

export type UploadStreamResponse = {
  message: string // Embedding... (0.00%)
  progress: number
} | {
  message: 'Extracted text from PDF'
} | {
  message: 'Split text into chunks'
} | {
  message: 'Inserted vectors'
  chunks: number
}

export interface Document {
  name: string
  size: number
  chunks: number | null
  progress?: string
}
