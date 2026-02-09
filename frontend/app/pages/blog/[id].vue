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
        </div>
      </div>
    </nav>

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
    </article>
  </div>
</template>

<style scoped>
/* 确保长文本不溢出 */
.prose {
  color: #e6edf3;
  --tw-prose-headings: #ffffff;
}
</style>