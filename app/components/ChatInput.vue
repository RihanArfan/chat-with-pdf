<script lang="ts" setup>
defineProps<{ loading: boolean }>()

const message = ref('')
const emit = defineEmits<{ message: [message: string] }>()

const sendMessage = () => {
  if (!message.value.trim()) return
  emit('message', message.value)
  message.value = ''
}
</script>

<template>
  <div class="flex items-start p-3.5 relative">
    <UTextarea
      v-model="message"
      placeholder="Ask a question about this document..."
      class="w-full"
      :ui="{ base: ['pr-11'] }"
      :rows="1"
      :maxrows="5"
      :disabled="loading"
      autoresize
      size="xl"
      @keydown.enter.exact.prevent="sendMessage"
      @keydown.enter.shift.exact.prevent="message += '\n'"
    />

    <UButton
      size="sm"
      icon="i-heroicons-arrow-up-20-solid"
      class="absolute top-5 right-5"
      :disabled="loading "
      @click="sendMessage"
    />
  </div>
</template>
