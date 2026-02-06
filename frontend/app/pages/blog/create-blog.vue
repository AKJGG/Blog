<template>
  <div class="min-h-screen bg-[#0d1117] p-4 md:p-8 font-sans">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-white flex items-center gap-2">
          <UIcon name="i-heroicons-pencil-square" class="text-gray-400" />
          撰写新文章
        </h1>
        <UButton color="gray" variant="ghost" to="/blog" icon="i-heroicons-x-mark" />
      </div>

      <UCard :ui="{ base: 'bg-[#161b22] border-[#30363d]', rounded: 'rounded-2xl' }">
        <UForm :state="state" :validate="validate" @submit="onSubmit" class="space-y-6">
          
          <UFormGroup label="文章标题" name="title" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.title"
              placeholder="输入引人注目的标题..."
              size="xl"
              color="white"
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500 text-white' } }, rounded: 'rounded-xl' }"
            />
          </UFormGroup>

          <UFormGroup label="所属分类" name="category" :ui="{ label: { text: 'text-gray-200' } }">
            <USelectMenu
              v-model="state.category"
              :options="categories"
              placeholder="选择分类"
              size="lg"
              :uiMenu="{ background: 'bg-[#161b22]', ring: 'ring-1 ring-[#30363d]', option: { active: 'bg-blue-600' } }"
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] text-white' } }, rounded: 'rounded-xl' }"
            >
              <template #leading>
                <UIcon v-if="state.category" name="i-heroicons-tag" class="text-blue-500" />
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup label="正文内容" name="content" :ui="{ label: { text: 'text-gray-200' } }">
            <UTextarea
              v-model="state.content"
              :rows="12"
              placeholder="开始你的创作... (支持 Markdown 语法)"
              color="white"
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500 text-white' } }, rounded: 'rounded-xl' }"
            />
          </UFormGroup>

          <div class="flex justify-end gap-3 pt-4 border-t border-[#30363d]">
            <UButton 
              variant="ghost" 
              color="gray" 
              label="保存草稿" 
              :disabled="isPending" 
              @click="onSaveDraft"
            />
            <UButton 
              type="submit"
              size="lg"
              class="bg-[#238636] hover:bg-[#2ea043] text-white font-bold px-8 transition-all"
              :loading="isPending"
              :ui="{ rounded: 'rounded-xl' }"
            >
              发布文章
            </UButton>
          </div>

        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const toast = useToast()
const isPending = ref(false)

// 5个指定分类
const categories = ['前端', '后端', '测试', '运维', '大模型']

const state = reactive({
  title: '',
  category: undefined,
  content: ''
})

const validate = (state: any) => {
  const errors = []
  if (!state.title) errors.push({ path: 'title', message: '标题不能为空' })
  if (!state.category) errors.push({ path: 'category', message: '请选择一个分类' })
  if (!state.content) errors.push({ path: 'content', message: '内容总得写点什么吧' })
  return errors
}

const onSubmit = async () => {
  isPending.value = true
  try {
    // 模拟 API 调用
    await useApi('/api/blog/create', {
      method: 'POST',
      body: state
    })
    
    toast.add({
      title: '发布成功！',
      description: '你的文章已同步至 GitHub Duck 社区',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
    
    // 跳转到博客列表或详情
    await navigateTo('/blog')
  } catch (err: any) {
    toast.add({
      title: '发布失败',
      description: err.data?.message || '网络拥堵，请稍后再试',
      color: 'red'
    })
  } finally {
    isPending.value = false
  }
}

const onSaveDraft = () => {
  toast.add({ title: '草稿已保存', icon: 'i-heroicons-information-circle' })
}
</script>