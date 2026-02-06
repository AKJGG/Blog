# 根目录配置文件

### File: nuxt.config.ts
```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', @nuxt/icon],
  runtimeConfig: {
    public:{
      apiBase: 'http://localhost:8000/api/v1'
  }
},

  ui: {
    icons: ['heroicons']
  },
})
```

### File: package.json
```json
{
  "name": "frontend",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/eslint": "1.13.0",
    "@nuxt/image": "2.0.0",
    "@nuxt/ui": "4.4.0",
    "eslint": "^9.0.0",
    "nuxt": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.3",
    "vue": "^3.5.27",
    "vue-router": "^4.6.4"
  }
}

```

### File: tsconfig.json
```json
{
  // https://nuxt.com/docs/guide/concepts/typescript
  "files": [],
  "references": [
    {
      "path": "./.nuxt/tsconfig.app.json"
    },
    {
      "path": "./.nuxt/tsconfig.server.json"
    },
    {
      "path": "./.nuxt/tsconfig.shared.json"
    },
    {
      "path": "./.nuxt/tsconfig.node.json"
    }
  ]
}

```

