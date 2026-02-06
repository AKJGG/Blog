<script setup lang="ts">
const route = useRoute()

// 直接抛出 404 错误，致命错误（fatal: true）会强制渲染根目录的 error.vue
throw createError({
  statusCode: 404,
  statusMessage: `页面 /${route.params.slug.join('/')} 不存在`,
  fatal: true
})
</script>

<template>
  <div></div>
</template>