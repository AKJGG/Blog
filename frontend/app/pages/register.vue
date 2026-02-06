<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] p-4 font-sans text-white">
    <UCard :ui="{ base: 'bg-[#161b22] border-[#30363d]', rounded: 'rounded-2xl' }" class="w-full max-w-sm border shadow-2xl">
      <UForm :state="state" :validate="validate" @submit="onSubmit">
        <div class="space-y-4">
          <h1 class="text-xl font-bold text-center text-white">创建账号</h1>
          
          <UFormGroup label="用户名" name="username" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.username" 
              color="white" 
              trailing-icon="i-heroicons-user" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="请设置用户名" 
              :disabled="isPending"
            />
          </UFormGroup>

          <UFormGroup label="电子邮箱" name="email" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.email" 
              color="white" 
              type="email"
              trailing-icon="i-heroicons-envelope" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="请输入有效邮箱" 
              :disabled="isPending"
            />
          </UFormGroup>

          <UFormGroup label="密码" name="password" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.password" 
              color="white" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500' } }, rounded: 'rounded-xl' }" 
              :type="isVisible ? 'text' : 'password'" 
              :trailing-icon="isVisible ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'" 
              size="lg" 
              placeholder="不少于6位" 
              :disabled="isPending"
              @click:trailing="isVisible = !isVisible" 
            />
          </UFormGroup>

          <UFormGroup label="确认密码" name="confirmPassword" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.confirmPassword" 
              color="white" 
              type="password"
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="请再次输入密码" 
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
            立即注册
          </UButton>

          <div class="text-sm text-center text-gray-400 pt-2">
            已有账号？<NuxtLink to="/login" class="text-[#4493f8] underline hover:text-[#58a6ff]">去登录</NuxtLink>
          </div>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

// 接口状态定义
interface RegisterState { 
  username?: string; 
  email?: string; 
  password?: string; 
  confirmPassword?: string 
}

const state = reactive<RegisterState>({ 
  username: '', 
  email: '', 
  password: '', 
  confirmPassword: '' 
})

const isPending = ref(false)  // ISP 加载态
const isVisible = ref(false)  // ISV 眼睛可见态
const toast = useToast()

// 表单校验
const validate = (state: RegisterState) => {
  const errors = []
  if (!state.username) errors.push({ path: 'username', message: '必须填写用户名' })
  if (!state.email) {
    errors.push({ path: 'email', message: '必须填写邮箱' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email!)) {
    errors.push({ path: 'email', message: '邮箱格式不正确' })
  }
  if (!state.password || state.password.length < 6) {
    errors.push({ path: 'password', message: '密码至少需要6位' })
  }
  if (state.password !== state.confirmPassword) {
    errors.push({ path: 'confirmPassword', message: '两次输入的密码不一致' })
  }
  return errors
}

// 提交：注册成功后直接自动登录
const onSubmit = async () => {
  isPending.value = true 
  try {
    // 1. 发起注册请求
    await useApi('/auth/register', {
      method: 'POST',
      body: {
        username: state.username,
        email: state.email,
        password: state.password
      }
    })

    // 2. 注册成功后，立即发起登录请求实现自动登录
    await useApi('/auth/login', {
      method: 'POST',
      body: {
        username: state.username,
        password: state.password
      }
    })

    toast.add({ title: '注册成功，已自动登录', color: 'green' })
    
    // 3. 全部成功后跳转首页
    navigateTo('/') 
    
  } catch (err: any) {
    // 错误处理：报错信息直截了当
    toast.add({
      title: '注册失败',
      description: err.data?.message || '请检查信息是否填写正确',
      color: 'red'
    })
  } finally {
    isPending.value = false 
  }
}
</script>
