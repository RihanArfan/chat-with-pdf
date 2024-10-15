<script setup lang="ts">
import type { UploadStreamResponse } from '~/types'

defineEmits(['hideDrawer'])
const toast = useToast()

// files
const documents = useDocuments()

// click to upload
const { open, onChange, reset } = useFileDialog({
  accept: 'application/pdf',
})
onChange(files => uploadFile(files))

// drag and drop
const dropZoneRef = ref<HTMLDivElement>()
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: uploadFile,
  dataTypes: ['application/pdf'],
  multiple: true,
  preventDefaultForUnhandled: true,
})

const isExampleSession = useIsExampleSession()
const exampleSessions = useExampleSessions()

// handle upload
const sessionId = useSessionId()
async function uploadFile(files: File[] | FileList | null) {
  if (!files) return
  if (isExampleSession.value) {
    return toast.add({
      title: 'Example session',
      description: 'Files cannot be uploaded to example sessions. Reload the page to start a new session.',
      color: 'error',
    })
  }

  for (const file of files) {
    const form = new FormData()
    form.append('file', file)
    form.append('sessionId', sessionId.value)

    documents.value.push({
      name: file.name,
      size: (Math.round((file.size / 1024 / 1024) * 1000) / 1000), // truncate up to 3 decimal places
      chunks: null,
      progress: 'Starting upload...',
    })
    const document = documents.value.find(doc => doc.name === file.name)

    try {
      const response = useStream<UploadStreamResponse>('/api/upload', form)()
      for await (const chunk of response) {
        if (chunk.message) document!.progress = chunk.message
        if (chunk.chunks) document!.chunks = chunk.chunks
        if (chunk.error) throw new Error(chunk.error)
      }

      if (document) delete document.progress // remove progress when done

      toast.add({
        id: file.name,
        title: 'File uploaded',
        description: file.name,
      })
    }
    catch (error) {
      toast.add({
        id: file.name,
        title: 'Error uploading file',
        // @ts-expect-error unknown error type
        description: `An error occurred while uploading ${file.name}. ${error?.message}`,
        color: 'error',
      })
      documents.value = documents.value.filter(doc => doc.name !== file.name)
    }
  }
  reset()
}

function setExampleSession(exampleSessionId: string) {
  const { id, ...documentInfo } = exampleSessions.find(example => example.id === exampleSessionId)!
  documents.value.push(documentInfo)
  sessionId.value = exampleSessionId
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex md:hidden items-center justify-between px-4 h-14">
      <div class="flex items-center gap-x-4">
        <h2 class="md:text-lg text-zinc-600 dark:text-zinc-300">
          Documents
        </h2>
      </div>
      <UButton
        icon="i-heroicons-x-mark-20-solid"
        color="neutral"
        variant="ghost"
        class="md:hidden"
        @click="$emit('hideDrawer')"
      />
    </div>
    <USeparator />
    <div class="p-4 space-y-6 overflow-y-auto flex flex-col">
      <UCard
        ref="dropZoneRef"
        class="transition-all flex flex-grow mb-2 cursor-pointer hover:ring-emerald-500"
        :class="{ 'ring-blue-500  ring-opacity-50': isOverDropZone }"
        :ui="{ body: 'flex flex-col items-center justify-center' }"
        @click="open"
      >
        <p class="mb-1.5 text-lg font-semibold text-primary">
          Upload a file
        </p>
        <p class="text-zinc-500">
          Drag and drop or click to upload
        </p>
      </UCard>
    </div>

    <div class="px-4 pb-4 flex-1 space-y-2 overflow-y-auto flex flex-col">
      <h2 class="mb-2 text-lg font-semibold text-primary">
        Uploaded documents
      </h2>
      <div v-for="(document, i) in documents" :key="document.name" class="py-1">
        <p class="font-medium text-sm mb-1 truncate text-zinc-700 dark:text-zinc-300">
          {{ document.name }}
        </p>
        <p class="text-zinc-500 text-xs">
          {{ document.size }} MB
          <template v-if="document.chunks">
            &#x2022; {{ document.chunks }} chunks
          </template>
        </p>
        <div v-if="document.progress" class="mt-0.5 flex items-center px-1.5 gap-2">
          <LoadingIcon class="size-2" />
          <p class="text-zinc-400 text-xs ">
            {{ document.progress }}
          </p>
        </div>

        <USeparator v-if="i < documents.length - 1" class="mt-3" />
      </div>

      <p v-if="!documents.length" class="text-zinc-700 dark:text-zinc-300">
        No documents uploaded
      </p>

      <p v-if="!documents.length" class="mt-3">
        Try an example document:
      </p>
      <ul v-if="!documents.length" class="space-y-2 text-xs truncate cursor-pointer text-blue-500">
        <li v-for="example in exampleSessions" :key="example.id" @click="setExampleSession(example.id)">
          {{ example.name }}
        </li>
      </ul>
    </div>

    <USeparator />
    <div class="p-2">
      <UButton
        to="https://hub.nuxt.com?utm_source=chat-with-pdf"
        target="_blank"
        variant="link"
        color="neutral"
        size="sm"
      >
        Hosted on NuxtHub
      </UButton>
    </div>
  </div>
</template>
