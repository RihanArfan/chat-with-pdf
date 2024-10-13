// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-07-30',
  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },

  // https://nuxt.com/modules
  modules: [
    '@nuxthub/core',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/mdc',
    '@vueuse/nuxt',
    'nuxthub-ratelimit',
  ],

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    ai: true,
    blob: true,
    cache: true,
    database: true,
    kv: true,
    vectorize: {
      documents: {
        dimensions: 1024,
        metric: 'euclidean',
        metadataIndexes: {
          sessionId: 'string',
        },
      },
    },
  },

  nuxtHubRateLimit: {
    routes: {
      '/api/*': {
        maxRequests: 20,
        intervalSeconds: 60,
      },
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  // https://eslint.nuxt.com
  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
      },
    },
  },

  // https://devtools.nuxt.com
  devtools: { enabled: true },
})
