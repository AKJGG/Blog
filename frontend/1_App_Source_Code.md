# App 业务代码汇总

### File: app/app.vue
```html
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

```

### File: app/error.vue
```html
<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] p-4 font-sans text-white">
    <div class="text-center space-y-6">
      <h1 
        class="text-9xl font-black tracking-tighter opacity-20"
        :class="error?.statusCode >= 500 ? 'text-red-500' : 'text-gray-500'"
      >
        {{ error?.statusCode }}
      </h1>
      
      <div class="space-y-2">
        <h2 class="text-2xl font-bold">
          {{ errorContent.title }}
        </h2>
        <p class="text-gray-400 max-w-xs mx-auto">
          {{ errorContent.desc }}
        </p>
      </div>

      <div class="pt-6 flex flex-col items-center gap-4">
        <UButton 
          size="lg" 
          class="bg-[#238636] hover:bg-[#2ea043] text-white px-10 font-bold" 
          :ui="{ rounded: 'rounded-xl' }"
          @click="handleAction"
        >
          {{ error?.statusCode === 401 ? '去登录' : '返回首页' }}
        </UButton>

        <code v-if="error?.statusMessage" class="text-[10px] text-gray-600 font-mono bg-[#161b22] px-2 py-1 rounded">
          {{ error.statusMessage }}
        </code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  error: Object
})

// 状态码语义化：有话直说
const errorContent = computed(() => {
  const s = props.error?.statusCode
  if (s === 401) return { title: '登录失败', desc: '你还没登录，或者登录已过期。' }
  if (s === 403) return { title: '访问受限', desc: '你没有权限操作这个资源。' }
  if (s === 404) return { title: '页面不存在', desc: '你要找的路径不在这里。' }
  if (s === 405) return { title: '方法禁用', desc: '请求方式（GET/POST）不对。' }
  if (s >= 500) return { title: '服务器崩了', desc: '后端程序报错，请联系管理员。' }
  return { title: '出错了', desc: '发生了一些不可预料的问题。' }
})

// 处理函数
const handleAction = () => {
  if (props.error?.statusCode === 401) {
    clearError({ redirect: '/login' })
  } else {
    clearError({ redirect: '/' })
  }
}
</script>
```

### File: app/composables/useApi.ts
```typescript
export const useApi = (url: string, options: any = {}) => {
  const config = useRuntimeConfig()
  const toast = useToast()

  // 1. 获取基础配置
  const apiBase = config.public.apiBase || 'http://localhost:8000/api/v1'

  // 2. 默认请求配置
  const defaults = {
    baseURL: apiBase,
    key: url, // 用于 useAsyncData 缓存标识

    // 请求拦截器：注入 Token
    onRequest({ options }: any) {
      // 假设 token 存储在 cookie 或 localStorage 中
      const token = useCookie('auth_token').value
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },

    // 响应拦截器：全局错误处理
    onResponseError({ response }: any) {
      const status = response.status
      const message = response._data?.message || '未知错误'

      // 针对特定状态码的业务逻辑
      if (status === 401) {
        // 未授权：跳转登录或清理状态
        // 注意：在 Composables 中直接使用 clearError 需要小心生命周期
        // 这里通常配合 UI 提示
        toast.add({ title: '登录过期', description: '请重新登录', color: 'red' })
      } else if (status === 403) {
        toast.add({ title: '权限不足', description: '您没有操作此资源的权限', color: 'orange' })
      }
      
      // 抛出错误以便在页面级 catch
      return Promise.reject(response)
    }
  }

  // 3. 合并参数并执行请求
  // 使用 $fetch 处理命令式请求 (onSubmit)，或配合 useAsyncData 使用
  return $fetch(url, { ...defaults, ...options })
}
```

### File: app/pages/[...slug].vue
```html
<script setup lang="ts">
const route = useRoute()

// 直接抛出 404 错误，致命错误（fatal: true）会强制渲染根目录的 error.vue
throw createError({
  statusCode: 404,
  statusMessage: `页面 /${route.params.slug.join('/')} 不存在`,
  fatal: true
})
</script>

<template>
  <div></div>
</template>
```

### File: app/pages/[id]-password-reset.vue
```html
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

```

### File: app/pages/login.vue
```html
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
```

### File: app/pages/password-reset.vue
```html
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

```

### File: app/pages/register.vue
```html
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

```

### File: app/pages/blog/[id].vue
```html
<template>
  <div class="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans pb-20">
    <nav class="sticky top-0 z-10 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#30363d] px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <UButton icon="i-heroicons-chevron-left" variant="ghost" color="gray" to="/blog">返回列表</UButton>
        <div class="flex gap-2">
          <UButton icon="i-heroicons-pencil-square" variant="ghost" color="gray" :to="`/blog/edit/${route.params.id}`">编辑</UButton>
          <UButton icon="i-heroicons-trash" variant="ghost" color="red" :to="{ path: '/blog/delete', query: { id: route.params.id } }">删除</UButton>
        </div>
      </div>
    </nav>

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
    </article>
  </div>
</template>

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
  --tw-prose-headings: #ffffff;
}
</style>
```

### File: app/pages/blog/create-blog.vue
```html
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
```

### File: app/pages/blog/update-blog.vue
```html
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
```

### File: app/pages/user/me.vue
```html
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
```

