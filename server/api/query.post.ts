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
  const { messages, sessionId } = await readValidatedBody(event, schema.parse)
  const eventStream = createEventStream(event)
  const streamResponse = (data: object) => eventStream.push(JSON.stringify(data))

  event.waitUntil((async () => {
    try {
      const params = await processUserQuery({ messages, sessionId }, streamResponse)
      const result = await hubAI().run('@cf/meta/llama-3.1-8b-instruct', { messages: params.messages, stream: true }) as ReadableStream
      for await (const chunk of result) {
        // Send ReadableStream to client using existing stream. Calling sendStream() doesn't work when deployed.
        const chunkString = new TextDecoder().decode(chunk).slice(5) // remove data: prefix
        await eventStream.push(chunkString)
      }
    }
    catch (error) {
      consola.error(error)
      await streamResponse({ error: (error as Error).message })
    }
    finally {
      await eventStream.close()
    }
  })())

  return eventStream.send()
})
