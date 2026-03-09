import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { getAdminOrders, updateAdminOrder } from '../../lib/adminApi'

const ADMIN_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 1000

const STATUS_MAP = {
  pending: { label: 'Menunggu', icon: Clock, cls: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Lunas', icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', icon: AlertTriangle, cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Dibatalkan', icon: XCircle, cls: 'bg-red-100 text-red-700' },
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const reqRef = useRef(0)

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS)

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const load = useCallback(async () => {
    const reqId = ++reqRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminOrders({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        limit: ADMIN_PER_PAGE,
      })
      if (reqRef.current !== reqId) return
      setOrders(Array.isArray(res.data) ? res.data : [])
      setTotalPages(res.totalPages || 1)
    } catch (e) {
      if (reqRef.current !== reqId) return
      setError(e.message)
      setOrders([])
    } finally {
      if (reqRef.current === reqId) setLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => { load() }, [load])

  const goPage = useCallback(
    (p) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  )

  const openModal = (order) => {
    setModal({
      ...order,
      newStatus: order.status,
      newNote: order.admin_note || '',
    })
  }

  const handleUpdate = async () => {
    if (!modal) return
    setSaving(true)
    setError(null)
    try {
      await updateAdminOrder(modal.id, {
        status: modal.newStatus,
        admin_note: modal.newNote,
      })
      setModal(null)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const pageNumbers = []
  const maxVisible = 5
  let start = Math.max(1, page - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pageNumbers.push(i)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari order ID, nama, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="paid">Lunas</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
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
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Belum ada transaksi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Pembeli</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tanggal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((o) => {
                  const st = STATUS_MAP[o.status] || STATUS_MAP.pending
                  const Icon = st.icon
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-mono font-medium text-gray-900">
                        {o.order_id}
                      </td>
                      <td className="max-w-[180px] px-4 py-3">
                        <span className="block truncate text-sm text-gray-700" title={o.product_name}>
                          {o.product_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{o.customer_name}</div>
                        <div className="text-xs text-gray-500">{o.customer_email}</div>
                        {o.customer_whatsapp && (
                          <div className="text-xs text-gray-500">WA: {o.customer_whatsapp}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        Rp{Number(o.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
                          <Icon className="h-3 w-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {new Date(o.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => openModal(o)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {start > 1 && (
            <>
              <button onClick={() => goPage(1)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">1</button>
              {start > 2 && <span className="px-1 text-gray-400">...</span>}
            </>
          )}
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => goPage(n)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                n === page ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >{n}</button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
              <button onClick={() => goPage(totalPages)} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">{totalPages}</button>
            </>
          )}
          <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detail / Update Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Detail Order</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Order ID</span><span className="font-mono font-medium">{modal.order_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Produk</span><span className="font-medium text-gray-900">{modal.product_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pembeli</span><span>{modal.customer_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{modal.customer_email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">WhatsApp</span><span>{modal.customer_whatsapp}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">Rp{Number(modal.amount).toLocaleString('id-ID')}</span></div>
              <hr />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={modal.newStatus}
                  onChange={(e) => setModal((m) => ({ ...m, newStatus: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="pending">Menunggu Pembayaran</option>
                  <option value="paid">Lunas (Paid)</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Catatan Admin</label>
                <textarea
                  value={modal.newNote}
                  onChange={(e) => setModal((m) => ({ ...m, newNote: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Catatan opsional..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
