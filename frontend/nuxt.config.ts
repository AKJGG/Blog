// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
<<<<<<< HEAD
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@nuxt/icon'],
=======
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', @nuxt/icon],
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d
  runtimeConfig: {
    public:{
      apiBase: 'http://localhost:8000/api/v1'
  }
},

  ui: {
    icons: ['heroicons']
  },
<<<<<<< HEAD
})
=======
})
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d
