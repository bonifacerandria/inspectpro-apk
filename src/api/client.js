import axios from 'axios'
import { useAuthStore } from '../context/authStore'

// ⚠️ À adapter : URL publique de l'API (même backend que le web).
// Utiliser une variable d'environnement via app.config.js une fois en prod
// plutôt qu'une valeur en dur (voir Phase 3.2).
const API_URL = 'https://mid-rg.bmoinet.net/api'

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
