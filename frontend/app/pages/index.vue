<script setup lang="ts">
// 1. 状态管理
const categories = ['全部', '前端', '后端', '人工智能', '运维', '测试']
const selectedCategory = ref('全部')
const searchQuery = ref('')
const toast = useToast()

// 2. 获取数据：支持“全部”、“分类筛选”和“搜索”
const { data: blogResponse, pending, refresh } = await useAsyncData(
  'blogs-data',
  async () => {
    // 逻辑 A：如果有搜索关键词，优先走搜索接口
    if (searchQuery.value) {
      return await useApi(`/api/search?q=${searchQuery.value}`)
    }
    // 逻辑 B：如果分类不是“全部”，走过滤接口
    if (selectedCategory.value !== '全部') {
      return await useApi(`/api/search/filter?cat=${selectedCategory.value}`)
    }

    // 逻辑 C：默认主页（全部），根据你的需求，这里后端应该返回“按热度排序”的文章
    // 如果后端还没写热度接口，暂时先调用 /api/blog
    return await useApi('/api/blog')
  },
  {
    watch: [selectedCategory] // 切换分类自动重新请求
  }
)

const blogs = computed(() => blogResponse.value?.data || [])

// 3. 互动逻辑：集成匿名拦截
const { toggleAction } = useInteraction() // 使用我们刚才讨论的 composable

const handleLike = async (id: number) => {
  const result = await toggleAction(id, 'like')
  if (result) {
    toast.add({ title: result.message, color: 'green', icon: 'i-heroicons-check-circle' })
    refresh() // 刷新列表以获取最新点赞数
  }
}

// 4. 辅助函数
const onSearch = () => refresh()
const today = new Date().toLocaleDateString()
</script>

<template>
  <UContainer class="py-10">
    <header class="mb-10">
      <div class="flex items-end gap-3 mb-2">
        <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          社区动态
        </h1>
        <UBadge color="orange" variant="subtle" class="mb-1">
          每日 0:00 自动更新热榜
        </UBadge>
      </div>
      <p class="text-gray-500">
        当前日期：{{ today }} | 根据点赞与评论权重实时计算热度
      </p>
    </header>

    <div class="flex flex-col md:flex-row gap-4 justify-between mb-8">
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        <UButton
          v-for="cat in categories"
          :key="cat"
          :variant="selectedCategory === cat ? 'solid' : 'soft'"
          :color="selectedCategory === cat ? 'primary' : 'gray'"
          class="rounded-full transition-all"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </UButton>
      </div>
      
      <div class="flex gap-2">
        <UInput
          v-model="searchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="搜你想看的..."
          @keyup.enter="onSearch"
        />
        <UButton color="black" @click="onSearch">搜索</UButton>
      </div>
    </div>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 6" :key="i" class="h-80 w-full rounded-xl" />
    </div>

    <div v-else-if="blogs.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard 
        v-for="(blog, index) in blogs" 
        :key="blog.id"
        class="group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl"
      >
        <template v-if="selectedCategory === '全部' && index < 3" #header>
          <div class="flex items-center gap-1 text-orange-500 font-bold text-sm">
            <UIcon name="i-heroicons-fire" />
            TOP {{ index + 1 }} 热文
          </div>
        </template>

        <div @click="navigateTo(`/blog/${blog.id}`)" class="cursor-pointer">
          <img 
            :src="blog.cover || 'https://picsum.photos/seed/' + blog.id + '/400/200'" 
            class="w-full h-44 object-cover rounded-lg mb-4"
          />
          <h2 class="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
            {{ blog.title }}
          </h2>
          <p class="text-gray-500 text-sm line-clamp-2 mb-4">
            {{ blog.content.replace(/<[^>]*>/g, '') }}
          </p>
        </div>

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UAvatar :src="blog.author?.avatar" size="xs" />
              <span class="text-xs font-medium text-gray-600">{{ blog.author?.username }}</span>
            </div>
            
            <div class="flex items-center gap-4">
              <button 
                class="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
                @click.stop="handleLike(blog.id)"
              >
                <UIcon name="i-heroicons-heart" />
                <span class="text-xs">{{ blog.likesCount || 0 }}</span>
              </button>
              <div class="flex items-center gap-1 text-gray-400">
                <UIcon name="i-heroicons-chat-bubble-left" />
                <span class="text-xs">{{ blog.commentsCount || 0 }}</span>
              </div>
            </div>
          </div>
        </template>
      </UCard>
    </div>

    <div v-else class="text-center py-24">
      <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto text-gray-200" />
      <p class="mt-4 text-gray-400">这里的世界空空如也...</p>
      <UButton variant="link" @click="selectedCategory = '全部'; searchQuery = ''">返回广场</UButton>
    </div>
  </UContainer>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>