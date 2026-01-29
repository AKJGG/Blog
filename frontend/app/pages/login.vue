<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] p-4">
    <UCard :ui="{ base: 'bg-[#161b22] border-[#30363d]', rounded: 'rounded-2xl' }" class="w-full max-w-sm border shadow-2xl">
      <UForm :state="state" :validate="validate" @submit="onSubmit">
        <div class="space-y-4">
          <h1 class="text-xl font-bold text-center text-white">登录</h1>
          
          <UFormGroup label="用户名" name="username" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.username" 
              color="white" 
              trailing-icon="i-heroicons-user" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="请输入用户名" 
            />
          </UFormGroup>

          <UFormGroup name="password" :ui="{ label: { text: 'text-gray-200' } }">
            <template #label>
              <div class="flex justify-between w-full">
                <span>密码</span>
                <NuxtLink to="/forgot" class="text-xs text-[#4493f8]">忘记密码？</NuxtLink>
              </div>
            </template>
            <UInput 
              v-model="state.password" 
              color="white" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500' } }, rounded: 'rounded-xl' }" 
              :type="isVisible ? 'text' : 'password'" 
              :trailing-icon="isVisible ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'" 
              size="lg" 
              placeholder="请输入密码" 
              @click:trailing="isVisible = !isVisible" 
            />
          </UFormGroup>

          <UButton 
            :ui="{ rounded: 'rounded-xl' }" 
            class="bg-[#238636] hover:bg-[#2ea043] text-white border border-[rgba(240,246,252,0.1)] font-bold transition-all" 
            size="lg" 
            type="submit" 
            block 
            :loading="isPending"
          >
            登录
          </UButton>

          <div class="text-sm text-center text-gray-400">
            没有账号？<NuxtLink to="/register" class="text-[#4493f8] underline">立即注册</NuxtLink>
          </div>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface LoginState { username?: string; password?: string }
const state = reactive<LoginState>({ username: '', password: '' })
const isPending = ref(false)
const isVisible = ref(false)
const toast = Toast
const validate = (state: any) => {
  const errors = []
  if (!state.username) errors.push({ path: 'username', message: '必须填写' })
  if (!state.password) errors.push({ path: 'password', message: '必须填写' })
  return errors
}
const onSubmit = async () => {
  isPending.value = true 
  try {
    // 调用真正的后端接口
    await useApi('/auth/login', {
      method: 'POST',
      body: state
    })
    toast.add({ title: '登录成功', color: 'green' })    
    // 成功直接转首页 (/) 或控制台 (/home)
    navigateTo('/')    
  } catch (err: any) {
    toast.add({
      title: '登录失败',
      description: err.data?.message || '请检查用户名或密码',
      color: 'red'
    })
  } finally {
    isPending.value = false 
  }
}
</script>