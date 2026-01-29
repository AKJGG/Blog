<template>
  <div class="min-h-screen bg-[#0d1117] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent text-[#e6edf3] font-sans pb-20">
    <div class="max-w-5xl mx-auto px-4 py-10">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[#30363d] pb-10">
        <div class="flex items-center gap-6">
          <UAvatar 
            src="https://github.com/nut-duck.png" 
            size="3xl" 
            class="ring-4 ring-[#30363d] shadow-2xl shadow-blue-500/20"
          />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-4xl font-black text-white tracking-tight">GitHub Duck</h1>
              <UBadge color="blue" variant="subtle" size="xs">PRO 作者</UBadge>
            </div>
            <p class="text-gray-400 mt-2 flex items-center gap-2 font-medium">
              <UIcon name="i-heroicons-sparkles" class="text-yellow-500" />
              这是您的内容控制台
            </p>
          </div>
        </div>

        <div class="flex gap-4">
          <div class="bg-[#161b22] px-6 py-3 rounded-2xl border border-[#30363d] shadow-inner">
            <span class="text-gray-500 text-xs block uppercase tracking-widest mb-1">文章总览</span>
            <span class="text-2xl font-black text-white">{{ blogs?.list?.length || 0 }} <small class="text-sm font-normal text-gray-500">篇</small></span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-6 text-gray-400 text-sm font-bold uppercase tracking-widest">
        <UIcon name="i-heroicons-bars-3-bottom-left" />
        内容列表
      </div>

      <div v-if="pending" class="grid gap-4">
        <UCard v-for="i in 5" :key="i" class="bg-[#161b22] border-[#30363d] h-20 animate-pulse" />
      </div>

      <template v-else-if="blogs?.list?.length">
        <div class="grid gap-4">
          <UCard 
            v-for="post in blogs.list" 
            :key="post.id" 
            :ui="{ 
              base: 'bg-[#161b22] border-[#30363d] hover:bg-[#1c2128] hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 group shadow-lg',
              body: { padding: 'p-5 sm:p-6' }
            }"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-6 overflow-hidden">
                <div class="hidden sm:flex flex-col items-center justify-center bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#30363d] group-hover:border-blue-500/50 transition-colors">
                  <span class="text-[9px] text-gray-500 font-bold">ID</span>
                  <span class="text-blue-500 font-mono font-bold leading-none">#{{ post.id }}</span>
                </div>
                
                <div class="truncate">
                  <h3 class="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {{ post.title }}
                  </h3>
                  <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span class="flex items-center gap-1.5 bg-[#0d1117] px-2 py-0.5 rounded">
                      <UIcon name="i-heroicons-calendar" class="w-3.5 h-3.5" /> {{ formatDate(post.createdAt) }}
                    </span>
                    <UBadge v-if="post.category" size="xs" color="gray" variant="soft" class="px-2">{{ post.category }}</UBadge>
                  </div>
                </div>
              </div>

              <UDropdown :items="getMenuItems(post)" :popper="{ placement: 'bottom-end', arrow: true }">
                <UButton 
                  color="white" 
                  variant="ghost" 
                  icon="i-heroicons-cog-6-tooth" 
                  class="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300"
                  size="xl"
                />
              </UDropdown>
            </div>
          </UCard>
        </div>
      </template>

      <UCard v-else class="text-center py-24 bg-[#161b22]/50 border-[#30363d] border-dashed rounded-3xl">
        <div class="flex flex-col items-center max-w-xs mx-auto">
          <div class="w-20 h-20 bg-[#0d1117] rounded-full flex items-center justify-center mb-6 border border-[#30363d]">
            <UIcon name="i-heroicons-document-magnifying-glass" class="w-10 h-10 text-gray-600" />
          </div>
          <h3 class="text-xl font-bold text-white">这里还是一片荒芜</h3>
          <p class="text-sm text-gray-500 mt-2">数据库中暂无记录。请确保您已经通过系统分配了自增 ID 文章。</p>
        </div>
      </UCard>
    </div>

    <UModal v-model="deleteModal.show" prevent-close>
      <UCard class="bg-[#161b22] border-[#30363d] shadow-2xl">
        <template #header>
          <div class="flex items-center gap-3 text-red-500 font-bold text-lg">
            <UIcon name="i-heroicons-exclamation-circle" class="w-6 h-6" />
            确认删除操作
          </div>
        </template>
        <div class="py-2">
           <p class="text-gray-300 leading-relaxed">
            您确定要永久移除文章 <span class="text-white font-bold underline decoration-red-500 decoration-2 underline-offset-4">"{{ deleteModal.postTitle }}"</span> 吗？
          </p>
          <p class="text-xs text-gray-500 mt-4 italic">注意：此操作将从数据库中直接物理删除，无法恢复。</p>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="soft" @click="deleteModal.show = false">取消</UButton>
            <UButton color="red" class="px-6 font-bold" :loading="deleteModal.loading" @click="confirmDelete">确认删除</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// 数据获取
const { data: blogs, pending, refresh } = await useAsyncData('my-full-posts', () => useApi('/api/blog/my-list'))
const toast = useToast()

const deleteModal = reactive({
  show: false,
  postId: null as number | null,
  postTitle: '',
  loading: false
})

const getMenuItems = (post: any) => [
  [{
    label: '编辑文章内容',
    icon: 'i-heroicons-pencil-square',
    // 修改处：跳转到新的 update-blog 页面
    click: () => navigateTo({ path: '/blog/update-blog', query: { id: post.id } })
  }],
  [{
    label: '在新窗口预览',
    icon: 'i-heroicons-arrow-top-right-on-square',
    click: () => window.open(`/blog/${post.id}`, '_blank')
  }],
  [{
    label: '危险操作：删除',
    icon: 'i-heroicons-trash',
    labelClass: 'text-red-500',
    iconClass: 'text-red-500',
    click: () => {
      deleteModal.postId = post.id
      deleteModal.postTitle = post.title
      deleteModal.show = true
    }
  }]
]

const confirmDelete = async () => {
  deleteModal.loading = true
  try {
    await useApi(`/api/blog/delete/${deleteModal.postId}`, { method: 'DELETE' })
    toast.add({ title: '删除成功', description: '数据已同步清理', color: 'green', icon: 'i-heroicons-check' })
    deleteModal.show = false
    refresh()
  } catch (err) {
    toast.add({ title: '删除失败', description: '您可能没有该权限', color: 'red' })
  } finally {
    deleteModal.loading = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', { 
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit' 
  })
}

useHead({ title: 'GitHub Duck - 内容管理控制台' })
</script>

<style scoped>
/* 增加一个平滑的过渡效果 */
.hover\:-translate-y-1:hover {
  transform: translateY(-4px);
}
</style>