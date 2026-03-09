import axios from 'axios'
import { API_URL, UPLOADS_URL } from './config'

const api = axios.create({ baseURL: API_URL })

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  },
)

export async function getProducts(params = {}) {
  const clean = {}
  if (params.search != null && params.search !== '') clean.search = params.search
  if (params.category != null && params.category !== '') clean.category = params.category
  if (params.sort != null && params.sort !== '') clean.sort = params.sort
  if (params.page != null) clean.page = String(params.page)
  if (params.limit != null) clean.limit = String(params.limit)
  const { data } = await api.get('/products', { params: clean })
  return data
}

export async function getSettings() {
  const { data } = await api.get('/settings')
  return data
}

export async function getProductBySlug(slug) {
  const { data } = await api.get(`/products/${encodeURIComponent(slug)}`)
  return data
}

export async function getCategories() {
  const { data } = await api.get('/categories')
  return data
}

export async function getTestimonials() {
  const { data } = await api.get('/testimonials')
  return data
}

export async function createCheckout(body) {
  const { data } = await api.post('/checkout', body)
  return data
}

export async function getOrderStatus(orderId) {
  const { data } = await api.get(`/orders/${encodeURIComponent(orderId)}`)
  return data
}

export function orderDownloadUrl(orderId) {
  return `${API_URL}/orders/${encodeURIComponent(orderId)}/download`
}

export function productImageUrl(path) {
  if (!path) return '/logo.png'
  if (path.startsWith('http')) return path
  return `${UPLOADS_URL}/${path.replace(/^\/+/, '')}`
}
