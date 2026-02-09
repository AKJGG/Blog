export const useApi = (url: string, options: any = {}) => {
  const config = useRuntimeConfig()
<<<<<<< HEAD
=======
  const toast = useToast()
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d

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
<<<<<<< HEAD
}
=======
}
>>>>>>> 0a9e07517288c40498ce52e730672311e4fab14d
