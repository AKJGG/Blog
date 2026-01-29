<template>
  <div class="min-h-screen bg-[#0d1117] p-4 md:p-8 text-[#e6edf3]">
    <div class="max-w-4xl mx-auto">
      
      <div v-if="loading && !isVerified" class="py-32 text-center">
        <UIcon name="i-heroicons-shield-check" class="w-12 h-12 text-blue-500 animate-pulse mx-auto" />
        <p class="text-gray-500 mt-4 font-medium">正在核实作者权限...</p>
      </div>

      <div v-else-if="error" class="py-32 text-center">
        <UCard class="bg-[#161b22] border-red-900/50 inline-block px-10">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 class="text-xl font-bold text-white">无法访问编辑器</h2>
          <p class="text-gray-400 mt-2 text-sm">该内容不存在，或您没有编辑权限。</p>
          <UButton to="/user/me" color="white" variant="solid" class="mt-6" icon="i-heroicons-arrow-left">
            返回管理面板
          </UButton>
        </UCard>
      </div>

      <template v-else>
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" to="/user/me" />
            <h1 class="text-2xl font-extrabold text-white tracking-tight">
              更新文章内容 <span class="text-blue-500 ml-2 font-mono text-lg">#{{ state.id }}</span>
            </h1>
          </div>
          
          <div class="flex gap-3">
            <UButton variant="ghost" color="gray" to="/user/me">放弃修改</UButton>
            <UButton 
              color="blue" 
              icon="i-heroicons-check" 
              label="发布更新" 
              class="px-6"
              :loading="submitting" 
              @click="onUpdate"
            />
          </div>
        </div>

        <div class="grid gap-6">
          <UCard :ui="{ base: 'bg-[#161b22] border-[#30363d]', body: { padding: 'p-0' } }">
            <div class="p-6 border-b border-[#30363d]">
              <UFormGroup label="文章标题" name="title" help="起一个能吸引读者的标题">
                <UInput 
                  v-model="state.title" 
                  placeholder="在此输入标题..." 
                  size="xl" 
                  color="white" 
                  variant="none"
                  class="text-xl font-bold p-0 focus:ring-0"
                />
              </UFormGroup>
            </div>

            <div class="p-0 relative">
              <div class="flex gap-4 p-2 bg-[#0d1117]/50 border-b border-[#30363d] px-6 text-gray-500">
                <UIcon name="i-heroicons-list-bullet" class="cursor-pointer hover:text-white" />
                <UIcon name="i-heroicons-link" class="cursor-pointer hover:text-white" />
                <UIcon name="i-heroicons-photo" class="cursor-pointer hover:text-white" />
              </div>

              <UTextarea 
                v-model="state.content" 
                :rows="22" 
                placeholder="开始更新你的精彩内容..." 
                color="white"
                variant="none"
                class="font-mono text-base leading-relaxed p-6 focus:ring-0"
              />
            </div>
          </UCard>

          <div class="flex justify-between items-center px-2 text-xs text-gray-500">
            <p>提示：更新后将立即同步至前台页面</p>
            <p v-if="lastSaved">上次保存时间：{{ lastSaved }}</p>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const toast = useToast()

const loading = ref(true)
const isVerified = ref(false)
const error = ref(false)
const submitting = ref(false)
const lastSaved = ref('')

const state = reactive({
  id: null as number | null,
  title: '',
  content: ''
})

// 1. 初始化鉴权与数据获取
onMounted(async () => {
  const blogId = route.query.id
  
  if (!blogId) {
    return navigateTo('/user/me')
  }

  try {
    // 调用详情接口。后端逻辑：如果 article.author_id !== token.uid，返回 403
    const data: any = await useApi(`/api/blog/detail/${blogId}`)
    
    state.id = data.id
    state.title = data.title
    state.content = data.content
    
    isVerified.value = true
    loading.value = false
  } catch (err) {
    error.value = true
    loading.value = false
    toast.add({ title: '权限验证失败', description: '您无权编辑此文章', color: 'red' })
  }
})

// 2. 提交更新
const onUpdate = async () => {
  if (!state.title.trim() || !state.content.trim()) {
    return toast.add({ title: '内容不能为空', color: 'orange' })
  }

  submitting.value = true
  try {
    await useApi(`/api/blog/update/${state.id}`, {
      method: 'PUT',
      body: {
        title: state.title,
        content: state.content
      }
    })
    
    toast.add({ title: '已发布', description: '文章更新已全网同步', color: 'green', icon: 'i-heroicons-check-circle' })
    lastSaved.value = new Date().toLocaleTimeString()
    
    // 更新后可选择留在页面或跳回
    setTimeout(() => navigateTo('/user/me'), 800)
  } catch (err) {
    toast.add({ title: '同步失败', description: '请检查网络连接', color: 'red' })
  } finally {
    submitting.value = false
  }
}

useHead({ title: `编辑文章 - ${state.title || '载入中'}` })
</script>

<style scoped>
/* 深度美化编辑器，去除边框杂音 */
:deep(textarea), :deep(input) {
  background: transparent !important;
  box-shadow: none !important;
}
</style>