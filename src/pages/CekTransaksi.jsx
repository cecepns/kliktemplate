import { useState } from 'react'
import { FileCheck, Loader2, Download, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { getOrderStatus, orderDownloadUrl } from '../lib/api'

const STATUS_CONFIG = {
  pending: {
    label: 'Menunggu Pembayaran',
    description: 'Silakan lakukan pembayaran sesuai instruksi yang diberikan.',
    icon: Clock,
    cls: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    iconCls: 'text-yellow-600',
  },
  paid: {
    label: 'Pembayaran Berhasil',
    description: 'Terima kasih! Pembayaran Anda telah dikonfirmasi.',
    icon: CheckCircle,
    cls: 'border-green-200 bg-green-50 text-green-800',
    iconCls: 'text-green-600',
  },
  expired: {
    label: 'Order Expired',
    description: 'Order ini telah melewati batas waktu pembayaran.',
    icon: AlertTriangle,
    cls: 'border-gray-200 bg-gray-50 text-gray-700',
    iconCls: 'text-gray-500',
  },
  cancelled: {
    label: 'Order Dibatalkan',
    description: 'Order ini telah dibatalkan.',
    icon: XCircle,
    cls: 'border-red-200 bg-red-50 text-red-800',
    iconCls: 'text-red-600',
  },
}

export default function CekTransaksi() {
  const [transactionId, setTransactionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState(null)

  const handleCek = async (e) => {
    e.preventDefault()
    const id = transactionId.trim()
    if (!id) return
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const data = await getOrderStatus(id)
      setOrder(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const status = order ? STATUS_CONFIG[order.status] || STATUS_CONFIG.pending : null
  const StatusIcon = status?.icon

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-8 shadow-card" data-aos="fade-up">
        <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-primary-600">
          <FileCheck className="h-6 w-6" />
          Cek Transaksi
        </h1>

        <form onSubmit={handleCek} className="space-y-4">
          <div>
            <label htmlFor="transaction-id" className="mb-2 block font-bold text-gray-900">
              Masukkan ID Transaksi:
            </label>
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <input
                id="transaction-id"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Contoh: ORD-M5XY2A-1B3C4D"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Cek
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-700">
            ID Transaksi bersifat{' '}
            <span className="font-semibold text-red-600">[Penting & Rahasia]</span>{' '}
            Jangan bagikan informasi tersebut kepada siapapun kecuali kliktemplate.com
          </p>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-card" data-aos="fade-up">
          <XCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-2 font-medium text-red-700">{error}</p>
        </div>
      )}

      {order && status && (
        <div className={`rounded-xl border-2 p-6 shadow-card ${status.cls}`} data-aos="fade-up">
          <div className="mb-4 flex items-center gap-3">
            <StatusIcon className={`h-8 w-8 ${status.iconCls}`} />
            <div>
              <h2 className="text-lg font-bold">{status.label}</h2>
              <p className="text-sm opacity-80">{status.description}</p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-white/80 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono font-semibold text-gray-900">{order.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Produk</span>
              <span className="font-medium text-gray-900">{order.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nama</span>
              <span className="text-gray-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">Rp{Number(order.amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal Order</span>
              <span className="text-gray-900">
                {new Date(order.created_at).toLocaleDateString('id-ID', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal Bayar</span>
                <span className="text-gray-900">
                  {new Date(order.paid_at).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {order.has_download && (
            <div className="mt-4">
              <a
                href={orderDownloadUrl(order.order_id)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700"
              >
                <Download className="h-5 w-5" />
                Download Template
              </a>
              <p className="mt-2 text-center text-xs opacity-70">
                Klik tombol di atas untuk mengunduh file template Anda.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
