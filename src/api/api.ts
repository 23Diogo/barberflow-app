import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = 'https://api.bbarberflow.com.br'
const TOKEN_KEY = 'barberflow_barber_token'

export const api = axios.create({ baseURL: API_URL })

// Interceptor: adiciona token em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const { data } = await api.post('/api/barber-auth/login', { email, password })
  await SecureStore.setItemAsync(TOKEN_KEY, data.token)
  return data
}

export async function logout() {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function getMe() {
  const { data } = await api.get('/api/barber-auth/me')
  return data
}

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

// ─── Appointments ──────────────────────────────────────────────────────────────

export type Period = 'day' | 'week' | 'month'

export async function getAppointments(period: Period, date: Date) {
  const dateStr = date.toISOString().split('T')[0]
  const { data } = await api.get('/api/barber-auth/appointments', {
    params: { period, date: dateStr },
  })
  return data
}
