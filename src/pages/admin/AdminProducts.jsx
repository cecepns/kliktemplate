import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  FileArchive,
} from 'lucide-react'
import {
  getAdminProducts,
  getAdminCategories,
  getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  productImageUrl,
} from '../../lib/adminApi'

const ADMIN_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 1000

const defaultForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  original_price: '',
  sold_count: '',
  category_id: '',
  is_new: false,
  is_featured: false,
  newImages: [],
  existingImages: [],
  templateFile: null,
  existingTemplate: null,
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const reqRef = useRef(0)

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const load = useCallback(async () => {
    const reqId = ++reqRef.current
    setLoading(true)
    setError(null)
    try {
      const [prodsRes, cats] = await Promise.all([
        getAdminProducts({ search: debouncedSearch || undefined, page, limit: ADMIN_PER_PAGE }),
        getAdminCategories(),
      ])
      if (reqRef.current !== reqId) return
      setProducts(Array.isArray(prodsRes.data) ? prodsRes.data : Array.isArray(prodsRes) ? prodsRes : [])
      setTotalPages(prodsRes.totalPages || 1)
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (e) {
      if (reqRef.current !== reqId) return
      setError(e.message)
      setProducts([])
      setCategories([])
    } finally {
      if (reqRef.current === reqId) setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load()
  }, [load])

  const goPage = useCallback(
    (p) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  )

  const openCreate = () => {
    setForm({ ...defaultForm, category_id: categories[0]?.id ?? '' })
    setModal('create')
  }

  const openEdit = async (id) => {
    setModal({ type: 'edit', id })
    setError(null)
    try {
      const p = await getAdminProduct(id)
      setForm({
        name: p.name ?? '',
        slug: p.slug ?? '',
        description: p.description ?? '',
        price: String(p.price ?? ''),
        original_price: String(p.original_price ?? ''),
        sold_count: String(p.sold_count ?? ''),
        category_id: p.category_id != null ? String(p.category_id) : '',
        is_new: Boolean(p.is_new),
        is_featured: Boolean(p.is_featured),
        newImages: [],
        existingImages: Array.isArray(p.images) ? p.images : [],
        templateFile: null,
        existingTemplate: p.template_file || null,
      })
    } catch (e) {
      setError(e.message)
      setModal(null)
    }
  }

  const closeModal = () => {
    setModal(null)
    setForm(defaultForm)
  }

  const buildFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('slug', form.slug || form.name.toLowerCase().replace(/\s+/g, '-'))
    fd.append('description', form.description)
    fd.append('price', form.price || '0')
    fd.append('original_price', form.original_price || '0')
    fd.append('sold_count', form.sold_count || '0')
    fd.append('category_id', form.category_id || '')
    fd.append('is_new', form.is_new ? '1' : '0')
    fd.append('is_featured', form.is_featured ? '1' : '0')
    for (const file of form.newImages) {
      fd.append('images', file)
    }
    if (form.templateFile) {
      fd.append('template', form.templateFile)
    }
    return fd
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const fd = buildFormData()
      if (modal === 'create') {
        await createProduct(fd)
      } else {
        await updateProduct(modal.id, fd)
      }
      closeModal()
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus produk "${name}"?`)) return
    setError(null)
    try {
      await deleteProduct(id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!isEdit) return
    setError(null)
    try {
      await deleteProductImage(modal.id, imageId)
      setForm((f) => ({
        ...f,
        existingImages: f.existingImages.filter((img) => img.id !== imageId),
      }))
    } catch (e) {
      setError(e.message)
    }
  }

  const handleRemoveNewImage = (index) => {
    setForm((f) => ({
      ...f,
      newImages: f.newImages.filter((_, i) => i !== index),
    }))
  }

  const isEdit = modal && typeof modal === 'object' && modal.type === 'edit'

  const pageNumbers = []
  const maxVisible = 5
  let start = Math.max(1, page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pageNumbers.push(i)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Belum ada produk.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Gambar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Harga</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Terjual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Template</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-2">
                      <div className="flex items-center gap-1">
                        {(p.images?.length ? p.images.slice(0, 3) : [{ image_path: p.image_path }]).map((img, idx) =>
                          img.image_path ? (
                            <div key={img.id ?? idx} className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
                              <img src={productImageUrl(img.image_path)} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div key={idx} className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )
                        )}
                        {p.images?.length > 3 && (
                          <span className="text-xs text-gray-400">+{p.images.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium text-gray-900" title={p.name}>
                          {p.name}
                        </span>
                        {!!p.is_new && (
                          <span className="shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700">
                            Baru
                          </span>
                        )}
                        {!!p.is_featured && (
                          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                            Unggulan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      Rp{Number(p.price).toLocaleString('id-ID')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {p.category_slug || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {p.sold_count ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {p.template_file ? (
                        <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                          <FileArchive className="h-3 w-3" /> Ada
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p.id)}
                        className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-primary-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="rounded p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {start > 1 && (
            <>
              <button
                onClick={() => goPage(1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                1
              </button>
              {start > 2 && <span className="px-1 text-gray-400">...</span>}
            </>
          )}
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => goPage(n)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                n === page
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {n}
            </button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
              <button
                onClick={() => goPage(totalPages)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {(modal === 'create' || isEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Produk' : 'Tambah Produk'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="otomatis dari nama"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Harga (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Harga asli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.original_price}
                    onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Terjual</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sold_count}
                    onChange={(e) => setForm((f) => ({ ...f, sold_count: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">— Pilih —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_new}
                    onChange={(e) => setForm((f) => ({ ...f, is_new: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Baru</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Unggulan</span>
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gambar Produk</label>
                {/* Existing images */}
                {form.existingImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.existingImages.map((img) => (
                      <div key={img.id} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        <img src={productImageUrl(img.image_path)} alt="" className="h-full w-full object-cover" />
                        {img.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            title="Hapus gambar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* New images preview */}
                {form.newImages.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.newImages.map((file, idx) => (
                      <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-dashed border-primary-300 bg-primary-50">
                        <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length) setForm((f) => ({ ...f, newImages: [...f.newImages, ...files] }))
                    e.target.value = ''
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-primary-700"
                />
                <p className="mt-1 text-xs text-gray-500">Bisa upload beberapa gambar sekaligus.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">File Template (Download)</label>
                {form.existingTemplate && !form.templateFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    <FileArchive className="h-4 w-4 text-primary-600" />
                    <span className="truncate">{form.existingTemplate}</span>
                  </div>
                )}
                {form.templateFile && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-dashed border-primary-300 bg-primary-50 px-3 py-2 text-sm text-primary-700">
                    <FileArchive className="h-4 w-4" />
                    <span className="truncate">{form.templateFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, templateFile: null }))}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept=".zip,.rar,.7z,.tar,.gz,.tar.gz"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setForm((f) => ({ ...f, templateFile: file }))
                    e.target.value = ''
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-primary-700"
                />
                <p className="mt-1 text-xs text-gray-500">File .zip/.rar yang akan dikirim ke pembeli setelah pembayaran berhasil.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEdit ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
