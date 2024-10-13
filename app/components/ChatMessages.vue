<script setup lang="ts">
import type { RoleScopedChatInput } from '~/types'

defineProps<{ messages: RoleScopedChatInput[] }>()


const informativeMessage = useInformativeMessage()
</script>

<template>
  <div ref="chatContainer" class="flex flex-col p-3 pb-0 space-y-2 h-full">
    <template
      v-for="(message, index) in messages"
      :key="`message-${index}`"
    >
      <div v-if="message.role === 'user'" class="flex items-center self-end bg-zinc-200 dark:bg-zinc-900 rounded-full px-3 py-1">
        <p>{{ message.content }}</p>
      </div>

      <AssistantMessage v-else :content="message.content" class="px-1" />
    </template>

    <div v-if="informativeMessage !== ''" class="flex gap-1.5 items-center px-3">
      <LoadingIcon class="size-4" />
      <p class="text-sm text-gray-500">
        {{ informativeMessage }}
      </p>
    </div>

  </div>
</template>
