// credits: https://github.com/ra-jeev/hub-chat/blob/main/app/composables/useAIChat.ts

export function useStream<T>(
  endpoint: string,
  body: Record<string, unknown> | FormData,
) {
  async function* response(): AsyncGenerator<T, void, unknown> {
    try {
      const response = await $fetch(endpoint, {
        method: 'POST',
        body,
        responseType: 'stream',
      })

      if (!(response instanceof ReadableStream)) throw new Error('Expected a stream response')

      let buffer = ''
      const reader = (response as ReadableStream)
        .pipeThrough(new TextDecoderStream())
        .getReader()

      while (true) {
        const { value, done } = await reader.read()

        if (done) {
          if (buffer.trim()) {
            console.warn('Stream ended with unparsed data:', buffer)
          }
          return
        }

        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice('data: '.length).trim()
            if (data === '[DONE]') return

            try {
              const jsonData = JSON.parse(data)
              if (jsonData) {
                yield jsonData
              }
            }
            catch (parseError) {
              console.warn('Error parsing JSON:', parseError)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  return response
}
