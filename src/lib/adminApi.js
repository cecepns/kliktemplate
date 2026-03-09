import axios from 'axios'
import { getAuthToken } from './auth'
import { API_URL, UPLOADS_URL } from './config'

const admin = axios.create({ baseURL: `${API_URL}/admin` })

admin.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

admin.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  },
)

function unwrap(promise) {
  return promise.then((res) => res.data)
}

export async function getAdminCategories() {
  return unwrap(admin.get('/categories'))
}

export async function createCategory(body) {
  return unwrap(admin.post('/categories', body))
}

export async function updateCategory(id, body) {
  return unwrap(admin.put(`/categories/${id}`, body))
}

export async function deleteCategory(id) {
  await admin.delete(`/categories/${id}`)
}

export async function getAdminProducts(params = {}) {
  const clean = {}
  if (params.search != null && params.search !== '') clean.search = params.search
  if (params.page != null) clean.page = String(params.page)
  if (params.limit != null) clean.limit = String(params.limit)
  return unwrap(admin.get('/products', { params: clean }))
}

export async function getAdminProduct(id) {
  return unwrap(admin.get(`/products/${id}`))
}

export async function createProduct(formData) {
  return unwrap(admin.post('/products', formData))
}

export async function updateProduct(id, formData) {
  return unwrap(admin.put(`/products/${id}`, formData))
}

export async function deleteProduct(id) {
  await admin.delete(`/products/${id}`)
}

export async function deleteProductImage(productId, imageId) {
  await admin.delete(`/products/${productId}/images/${imageId}`)
}

export async function getAdminTestimonials() {
  return unwrap(admin.get('/testimonials'))
}

export async function createTestimonial(body) {
  return unwrap(admin.post('/testimonials', body))
}

export async function updateTestimonial(id, body) {
  return unwrap(admin.put(`/testimonials/${id}`, body))
}

export async function deleteTestimonial(id) {
  await admin.delete(`/testimonials/${id}`)
}

export function productImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${UPLOADS_URL}/${path.replace(/^\/+/, '')}`
}

export async function getAdminOrders(params = {}) {
  const clean = {}
  if (params.search != null && params.search !== '') clean.search = params.search
  if (params.status != null && params.status !== '') clean.status = params.status
  if (params.page != null) clean.page = String(params.page)
  if (params.limit != null) clean.limit = String(params.limit)
  return unwrap(admin.get('/orders', { params: clean }))
}

export async function updateAdminOrder(id, body) {
  return unwrap(admin.put(`/orders/${id}`, body))
}

export async function getAdminSettings() {
  return unwrap(admin.get('/settings'))
}

export async function updateAdminSettings(body) {
  return unwrap(admin.put('/settings', body))
}
