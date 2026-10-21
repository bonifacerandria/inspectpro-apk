import axios from 'axios'
import { useAuthStore } from '../context/authStore'

// URL de l'API : injectée au build par eas.json (EXPO_PUBLIC_API_URL) ; la
// valeur par défaut sert pour `expo start` en développement.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mid-rg.bmoinet.net/api'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export default apiClient
