// original: https://github.com/RafalWilinski/cloudflare-rag/blob/2f4341bcf462c8f86001b601e59e60c25b1a6ea8/functions/api/stream.ts
import consola from 'consola'
import { z } from 'zod'

const schema = z.object({
  messages: z.array(
    z.object({
      role: z.union([z.literal('system'), z.literal('user'), z.literal('assistant'), z.literal('tool')]),
      content: z.string(),
    }),
  ),
  sessionId: z.string(),
})

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  const { messages, sessionId } = await readValidatedBody(event, schema.parse)

  event.waitUntil((async () => {
    try {
      const params = await processUserQuery({ messages, sessionId }, eventStream.push)
      const result = await hubAI().run('@cf/meta/llama-3.1-8b-instruct', { messages: params.messages, stream: true })
      sendStream(event, result as ReadableStream)
    }
    catch (error) {
      consola.error(error)
      await eventStream.push(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`)
      await eventStream.close()
    }
  })())

  return eventStream.send()
})
