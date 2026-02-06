<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] p-4 font-sans">
    <UCard :ui="{ base: 'bg-[#161b22] border-[#30363d]', rounded: 'rounded-2xl' }" class="w-full max-w-sm border shadow-2xl">
      
      <UForm v-if="!isSuccess" :state="state" :validate="validate" @submit="onSubmit">
        <div class="space-y-4">
          <h1 class="text-xl font-bold text-center text-white">找回密码</h1>
          
          <UFormGroup label="用户名" name="username" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.username" 
              color="white" 
              trailing-icon="i-heroicons-user" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500 text-white' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="请输入用户名" 
              :disabled="isPending"
            />
          </UFormGroup>

          <UFormGroup label="电子邮箱" name="email" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.email" 
              color="white" 
              type="email"
              trailing-icon="i-heroicons-envelope" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500 text-white' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="注册时使用的邮箱" 
              :disabled="isPending"
            />
          </UFormGroup>

          <UButton 
            :ui="{ rounded: 'rounded-xl' }" 
            class="bg-[#238636] hover:bg-[#2ea043] text-white border border-[rgba(240,246,252,0.1)] font-bold transition-all mt-2" 
            size="lg" 
            type="submit" 
            block 
            :loading="isPending"
          >
            发送重置邮件
          </UButton>

          <div class="text-sm text-center">
            <NuxtLink to="/login" class="text-[#4493f8] hover:underline">返回登录</NuxtLink>
          </div>
        </div>
      </UForm>

      <div v-else class="py-10 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div class="w-16 h-16 bg-[#238636]/10 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-paper-airplane" class="w-8 h-8 text-[#2ea043]" />
        </div>
        <h2 class="text-xl font-bold text-white">邮件已发送</h2>
        <p class="text-sm text-gray-400 px-2 leading-relaxed">
          重置链接已发送至 <span class="text-white font-mono">{{ state.email }}</span>，请在 15 分钟内查收。
        </p>
        <UButton to="/login" variant="ghost" class="text-[#4493f8] mt-4 hover:bg-[#4493f8]/10">
          返回登录
        </UButton>
      </div>

    </UCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const toast = useToast()
const isPending = ref(false) // ISP
const isSuccess = ref(false) // 后端成功标志

const state = reactive({
  username: '',
  email: ''
})

const validate = (state: any) => {
  const errors = []
  if (!state.username) errors.push({ path: 'username', message: '必须填写' })
  if (!state.email) {
    errors.push({ path: 'email', message: '必须填写' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
    errors.push({ path: 'email', message: '格式不正确' })
  }
  return errors
}

const onSubmit = async () => {
  isPending.value = true
  try {
    // 这里的 url 对应你后端的发起重置请求接口
    await useApi('/auth/password-reset-request', {
      method: 'POST',
      body: state
    })

    toast.add({ title: '邮件已发送', color: 'green' })
    isSuccess.value = true // 只有后端发信成功才切换页面
    
  } catch (err: any) {
    toast.add({
      title: '操作失败',
      description: err.data?.message || '请检查用户名和邮箱是否匹配',
      color: 'red'
    })
  } finally {
    isPending.value = false
  }
}
</script>
