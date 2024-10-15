<script setup lang="ts">
import type { RoleScopedChatInput } from '~/types'

defineProps<{ messages: RoleScopedChatInput[] }>()

// scroll to bottom
// const chatContainer = useTemplateRef('chatContainer')
// let observer: MutationObserver | null = null

// onMounted(() => {
//   if (chatContainer.value) {
//     observer = new MutationObserver(() => {
//       if (chatContainer.value) {
//         chatContainer.value.scrollTop = chatContainer.value.scrollHeight
//       }
//     })

//     observer.observe(chatContainer.value, {
//       childList: true,
//       subtree: true,
//       characterData: true,
//     })
//   }
// })

// onUnmounted(() => {
//   if (observer) {
//     observer.disconnect()
//   }
// })

const informativeMessage = useInformativeMessage()
const relevantContext = useRelevantContext()
const queries = useQueries()
</script>

<template>
  <div class="flex flex-col p-3 pb-0 space-y-2 h-full">
    <template
      v-for="(message, index) in messages"
      :key="`message-${index}`"
    >
      <div v-if="message.role === 'user'" class="flex items-center self-end bg-zinc-200 dark:bg-zinc-900 rounded-full px-3 py-1">
        <p>{{ message.content }}</p>
      </div>

      <AssistantMessage v-else :content="message.content" class="px-1" />
    </template>

    <!-- Progress message -->
    <div v-if="informativeMessage !== ''" class="flex gap-1.5 items-center px-3 pt-2 pb-1">
      <LoadingIcon class="size-4" />
      <p class="text-sm text-gray-500">
        {{ informativeMessage }}
      </p>
      <!-- <p class="text-sm text-gray-400">
        (4.1s)
      </p> -->
    </div>

    <!-- See relevant context -->
    <USlideover title="Query information">
      <div v-show="relevantContext.isProvided">
        <UButton color="neutral" variant="outline" class="inline-l">
          See relevant context
        </UButton>
      </div>

      <template #body>
        <h2 class="font-semibold text-lg mb-1">
          Queries to vector database
        </h2>
        <ul class="list-disc pl-4">
          <li v-for="(context, i) in queries" :key="i">
            {{ context }}
          </li>
        </ul>

        <h2 class="font-semibold text-lg mb-1 mt-6">
          Relevant context fetched from documents
        </h2>

        <ul class="list-disc pl-4">
          <li v-for="(context, i) in relevantContext.context" :key="i">
            <AssistantMessage :content="context" />
          </li>
        </ul>

        <p v-if="!relevantContext.context.length">
          No relevant context
        </p>
      </template>
    </USlideover>
  </div>
</template>
