<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] p-4 font-sans text-white">
    <div class="text-center space-y-6">
      <h1 
        class="text-9xl font-black tracking-tighter opacity-20"
        :class="error?.statusCode >= 500 ? 'text-red-500' : 'text-gray-500'"
      >
        {{ error?.statusCode }}
      </h1>
      
      <div class="space-y-2">
        <h2 class="text-2xl font-bold">
          {{ errorContent.title }}
        </h2>
        <p class="text-gray-400 max-w-xs mx-auto">
          {{ errorContent.desc }}
        </p>
      </div>

      <div class="pt-6 flex flex-col items-center gap-4">
        <UButton 
          size="lg" 
          class="bg-[#238636] hover:bg-[#2ea043] text-white px-10 font-bold" 
          :ui="{ rounded: 'rounded-xl' }"
          @click="handleAction"
        >
          {{ error?.statusCode === 401 ? '去登录' : '返回首页' }}
        </UButton>

        <code v-if="error?.statusMessage" class="text-[10px] text-gray-600 font-mono bg-[#161b22] px-2 py-1 rounded">
          {{ error.statusMessage }}
        </code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  error: Object
})

// 状态码语义化：有话直说
const errorContent = computed(() => {
  const s = props.error?.statusCode
  if (s === 401) return { title: '登录失败', desc: '你还没登录，或者登录已过期。' }
  if (s === 403) return { title: '访问受限', desc: '你没有权限操作这个资源。' }
  if (s === 404) return { title: '页面不存在', desc: '你要找的路径不在这里。' }
  if (s === 405) return { title: '方法禁用', desc: '请求方式（GET/POST）不对。' }
  if (s >= 500) return { title: '服务器崩了', desc: '后端程序报错，请联系管理员。' }
  return { title: '出错了', desc: '发生了一些不可预料的问题。' }
})

// 处理函数
const handleAction = () => {
  if (props.error?.statusCode === 401) {
    clearError({ redirect: '/login' })
  } else {
    clearError({ redirect: '/' })
  }
}
</script>