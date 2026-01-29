<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] p-4 font-sans">
    <UCard :ui="{ base: 'bg-[#161b22] border-[#30363d]', rounded: 'rounded-2xl' }" class="w-full max-w-sm border shadow-2xl">
      
      <UForm v-if="!isSuccess" :state="state" :validate="validate" @submit="onSubmit">
        <div class="space-y-4">
          <h1 class="text-xl font-bold text-center text-white">设置新密码</h1>
          
          <UFormGroup label="新密码" name="password" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.password" 
              color="white" 
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500 text-white' } }, rounded: 'rounded-xl' }" 
              :type="isVisible ? 'text' : 'password'" 
              :trailing-icon="isVisible ? 'i-heroicons-eye' : 'i-heroicons-eye-slash'" 
              size="lg" 
              placeholder="输入新密码" 
              :disabled="isPending"
              @click:trailing="isVisible = !isVisible" 
            />
          </UFormGroup>

          <UFormGroup label="确认密码" name="confirmPassword" :ui="{ label: { text: 'text-gray-200' } }">
            <UInput 
              v-model="state.confirmPassword" 
              color="white" 
              type="password"
              :ui="{ color: { white: { outline: 'bg-[#0d1117] border-[#30363d] focus:ring-blue-500 text-white' } }, rounded: 'rounded-xl' }" 
              size="lg" 
              placeholder="再次输入密码" 
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
            确认修改
          </UButton>
        </div>
      </UForm>

      <div v-else class="py-8 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <UIcon name="i-heroicons-check-badge" class="w-16 h-16 text-[#2ea043]" />
        <h2 class="text-xl font-bold text-white">修改成功</h2>
        <p class="text-sm text-gray-400">您的密码已经更新，请重新登录</p>
        <UButton to="/login" block class="bg-white text-black font-bold mt-4 hover:bg-gray-200" size="lg" :ui="{ rounded: 'rounded-xl' }">
          去登录
        </UButton>
      </div>

    </UCard>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const route = useRoute()
const toast = useToast()

const isPending = ref(false) // ISP
const isVisible = ref(false) // ISV
const isSuccess = ref(false) // 后端成功标志

const state = reactive({
  password: '',
  confirmPassword: ''
})

const validate = (state: any) => {
  const errors = []
  if (!state.password) errors.push({ path: 'password', message: '必须填写' })
  if (state.password && state.password.length < 6) errors.push({ path: 'password', message: '密码太短了' })
  if (state.password !== state.confirmPassword) {
    errors.push({ path: 'confirmPassword', message: '两次输入不一致' })
  }
  return errors
}

const onSubmit = async () => {
  isPending.value = true
  try {
    // 这里的 url 路径要对应你后端的重置确认接口
    await useApi('/auth/password-reset-confirm', {
      method: 'POST',
      body: {
        token: route.params.id, // 从 URL [id] 中获取的 token
        new_password: state.password
      }
    })

    toast.add({ title: '修改成功', color: 'green' })
    isSuccess.value = true // 切换到成功界面
    
  } catch (err: any) {
    toast.add({
      title: '重置失败',
      description: err.data?.message || '链接可能已失效',
      color: 'red'
    })
  } finally {
    isPending.value = false
  }
}
</script>
