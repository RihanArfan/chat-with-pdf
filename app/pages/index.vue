<script setup lang="ts">
import type { QueryStreamResponse } from '~/types'

const sessionId = useState<string>('sessionId', () => crypto.randomUUID())
const informativeMessage = useInformativeMessage()
const messages = useMessages()
const documents = useDocuments()
const isDrawerOpen = ref(false)

async function sendMessage(message: string) {
  messages.value.push({ role: 'user', content: message })

  const response = useStream<QueryStreamResponse>('/api/query', { messages: messages.value, sessionId: sessionId.value })()

  let responseAdded = false
  for await (const chunk of response) {
    if (chunk.message) {
      informativeMessage.value = chunk.message
      continue
    }

    if (chunk.response) {
      informativeMessage.value = ''

      if (!responseAdded) {
        messages.value.push({
          role: 'assistant',
          content: chunk.response,
        })
        responseAdded = true
      }
      else {
        messages.value[messages.value.length - 1]!.content += chunk.response
      }
    }
  }
}

const isChatEnabled = computed(() => informativeMessage.value === '' && !!documents.value.length)
</script>

<template>
  <div class="h-dvh flex flex-col md:flex-row max-h-dvh">
    <!-- <USlideover
      v-model="isDrawerOpen"
      :ui="{ content: 'md:hidden' }"
    >
      <SideBar @hide-drawer="isDrawerOpen = false" />
    </USlideover> -->

    <div class="hidden md:block max-w-xs w-full">
      <SideBar />
    </div>

    <USeparator orientation="vertical" class="hidden md:block" />

    <div class="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 ">
      <ChatHeader @show-drawer="isDrawerOpen = true" />
      <USeparator />

      <div class="overflow-y-auto h-full">
        <UContainer class="w-full h-full flex flex-col max-h-full max-w-3xl relative">
          <ChatMessages :messages />

          <ChatInput class="w-full absolute bottom-0 inset-x-0" :loading="!isChatEnabled" @message="sendMessage" />
        </UContainer>
      </div>
      <UContainer class="max-w-3xl w-full absolute bottom-0 inset-x-0" />
    </div>
  </div>
</template>
