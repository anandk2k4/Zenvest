// utils/api.ts
import axios from "axios"
import type { AxiosRequestConfig } from "axios"
import { useAuth } from "@clerk/clerk-react"

export const useApi = () => {
  const { getToken } = useAuth()

  const apiCall = async <T = any>(
    method: "get" | "post" | "put" | "delete",
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const token = await getToken()

    const response = await axios({
      method,
      url,
      data,
      ...config,
      headers: {
        ...(config?.headers || {}),
        Authorization: `Bearer ${token}`, // ✅ Attach Clerk JWT
      },
    })

    return response.data
  }

  return {
    get: <T = any>(url: string, config?: AxiosRequestConfig) => apiCall<T>("get", url, undefined, config),
    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => apiCall<T>("post", url, data, config),
    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => apiCall<T>("put", url, data, config),
    del: <T = any>(url: string, config?: AxiosRequestConfig) => apiCall<T>("delete", url, undefined, config),
  }
}
