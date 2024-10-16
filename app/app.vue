<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-white dark:bg-zinc-900 overscroll-none',
  },
})
useSeoMeta({
  title: 'Chat with PDF',
  ogTitle: 'Chat with PDF',
  ogDescription: 'Chat with PDF is a full-stack AI-powered application that lets you to ask questions to PDF documents. Built using NuxtHub, and powered by Cloudflare Workers AI and Vectorize.',
  description: 'Chat with PDF is a full-stack AI-powered application that lets you to ask questions to PDF documents. Built using NuxtHub, and powered by Cloudflare Workers AI and Vectorize.',
  ogImage: 'https://chat-with-pdf.nuxt.dev/image.png',
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
