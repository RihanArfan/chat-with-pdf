<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-white dark:bg-zinc-900 overscroll-none',
  },
})
useSeoMeta({
  title: 'Chat with PDF',
  ogTitle: 'Chat with your PDF documents',
  description:
    'Chat with PDF lets you ask questions to PDFs. Built using NuxtHub and Nuxt UI.',
  ogImage: '', // TODO:
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator />
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<style>
@import "tailwindcss";
@import "@nuxt/ui";

@plugin "@tailwindcss/typography";
</style>
