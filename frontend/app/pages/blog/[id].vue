<<<<<<< HEAD
<script setup lang="ts">
const route = useRoute()
const { toggleAction } = useInteraction()
const toast = useToast()

// 1. 获取数据
const { data: res, pending, error, refresh } = await useAsyncData(`blog-${route.params.id}`, () => 
  useApi(`/api/blog/${route.params.id}`)
)
const blog = computed(() => res.value?.data)

// 2. 互动：点赞
const handleLike = async () => {
  const result = await toggleAction(Number(route.params.id), 'like')
  if (result) {
    toast.add({ title: '已更新点赞状态', color: 'green' })
    refresh()
  }
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen bg-[#0d1117] text-[#e6edf3] pb-20">
    <nav class="sticky top-0 z-10 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" @click="navigateTo('/')">返回广场</UButton>
        <div class="flex gap-2">
          <UButton icon="i-heroicons-heart" variant="ghost" color="red" @click="handleLike">
            {{ blog?.likesCount || 0 }}
          </UButton>
          <UButton icon="i-heroicons-share" variant="ghost" color="gray" />
=======
<template>
  <div class="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans pb-20">
    <nav class="sticky top-0 z-10 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" to="/blog">返回列表</UButton>
        <div class="flex gap-2">
          <UButton icon="i-heroicons-pencil-square" variant="ghost" color="gray" :to="`/blog/edit/${route.params.id}`">编辑</UButton>
          <UButton icon="i-heroicons-trash" variant="ghost" color="red" :to="{ path: '/blog/delete', query: { id: route.params.id } }">删除</UButton>
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d
        </div>
      </div>
    </nav>

<<<<<<< HEAD
    <div v-if="pending" class="max-w-3xl mx-auto mt-20 text-center">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-blue-500 mx-auto" />
    </div>

    <article v-else-if="blog" class="max-w-3xl mx-auto px-4 mt-12">
      <header class="mb-10">
        <div class="flex items-center gap-2 mb-4">
          <UBadge color="blue" variant="soft">{{ blog.category }}</UBadge>
          <span class="text-gray-500 text-sm">{{ formatDate(blog.createdAt) }}</span>
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
          {{ blog.title }}
        </h1>
        <div class="flex items-center gap-3 py-4 border-y border-[#30363d]">
          <UAvatar :src="blog.author?.avatar" size="sm" />
          <div>
            <div class="font-bold text-gray-200">{{ blog.author?.username }}</div>
            <div class="text-xs text-gray-500">发布了这篇博文</div>
          </div>
        </div>
      </header>

      <div class="prose prose-invert prose-blue max-w-none break-words leading-relaxed text-lg">
        {{ blog.content }}
      </div>
      
      <footer class="mt-16 pt-8 border-t border-[#30363d] flex justify-center gap-8">
        <UButton 
          icon="i-heroicons-hand-thumb-up" 
          size="xl" 
          variant="soft" 
          color="gray" 
          class="rounded-full"
          @click="handleLike"
        >
          点赞支持 ({{ blog.likesCount || 0 }})
        </UButton>
      </footer>
=======
    <div v-if="pending" class="max-w-4xl mx-auto mt-20 flex flex-col items-center">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-blue-500" />
      <p class="mt-4 text-gray-500">内容加载中...</p>
    </div>

    <div v-else-if="error" class="max-w-4xl mx-auto mt-20 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold">文章不存在或加载失败</h2>
      <UButton class="mt-4" to="/blog">回到博客首页</UButton>
    </div>

    <article v-else class="max-w-4xl mx-auto px-4 mt-8 md:mt-12">
      <header class="mb-8 border-b border-[#30363d] pb-8">
        <div class="flex items-center gap-2 mb-4">
          <UBadge color="blue" variant="soft" size="md">{{ blog?.category }}</UBadge>
          <time class="text-sm text-gray-500">{{ formatDate(blog?.createdAt) }}</time>
        </div>
        <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-6">
          {{ blog?.title }}
        </h1>
        <div class="flex items-center gap-3">
          <UAvatar src="https://github.com/nut-duck.png" alt="Author" size="sm" />
          <span class="font-medium text-gray-300">GitHub Duck 作者</span>
        </div>
      </header>

      <div class="prose prose-invert prose-blue max-w-none break-words">
        <p class="whitespace-pre-wrap text-lg leading-relaxed">
          {{ blog?.content }}
        </p>
      </div>
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d
    </article>
  </div>
</template>

<<<<<<< HEAD
<style scoped>
/* 确保长文本不溢出 */
.prose {
  color: #e6edf3;
=======
<script setup lang="ts">
const route = useRoute()

// 1. 实战数据获取：使用 useAsyncData 配合你的 useApi
// 这里的 key 需要包含 id 以保证路由切换时重新抓取
const { data: blog, pending, error } = await useAsyncData(`blog-${route.params.id}`, () => 
  useApi(`/api/blog/detail/${route.params.id}`)
)

// 2. SEO 设置：动态设置页面标题
useHead({
  title: blog.value ? `${blog.value.title} - GitHub Duck` : '文章详情'
})

// 格式化日期工具
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '刚刚'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
/* 针对类似 GitHub 的暗色主题微调 prose 样式 */
.prose {
  --tw-prose-body: #e6edf3;
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d
  --tw-prose-headings: #ffffff;
}
</style>