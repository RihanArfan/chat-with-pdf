<script setup lang="ts">
import { parseMarkdown } from '#imports'

const props = defineProps<{
  content: string
}>()

const { data: ast, refresh } = await useAsyncData(useId(), () =>
  parseMarkdown(props.content),
)

watch(() => props.content, () => refresh())
</script>

<template>
  <MDCRenderer v-if="ast?.body" class="prose dark:prose-invert" :body="ast?.body" />
</template>
