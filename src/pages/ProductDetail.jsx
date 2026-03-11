import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Settings2, Minus, ChevronLeft, ChevronRight, Loader2, Copy, CheckCircle } from 'lucide-react'
import { getProductBySlug, productImageUrl, createCheckout } from '../lib/api'

function ImageGallery({ images }) {
  const [active, setActive] = useState(0)

  const count = images.length
  const canPrev = active > 0
  const canNext = active < count - 1

  const go = useCallback(
    (dir) => setActive((i) => Math.max(0, Math.min(count - 1, i + dir))),
    [count],
  )

  useEffect(() => {
    if (active >= count) setActive(Math.max(0, count - 1))
  }, [count, active])

  if (!count) {
    return (
      <div className="flex justify-center rounded-lg bg-gray-100 p-4">
        <div className="relative w-full max-w-xs aspect-square">
          <img
            src={productImageUrl(null)}
            alt="No image"
            className="h-full w-full rounded object-contain"
          />
        </div>
      </div>
    )
  }

  const current = images[active]

  return (
    <div className="space-y-3">
      <div className="group relative flex justify-center rounded-lg bg-gray-100 p-4">
        <div className="relative w-full max-w-md aspect-square">
          <img
            src={productImageUrl(current.image_path)}
            alt=""
            className="h-full w-full rounded object-contain"
          />
        </div>
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} disabled={!canPrev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow backdrop-blur transition-opacity hover:bg-white disabled:opacity-0">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} disabled={!canNext} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-gray-700 shadow backdrop-blur transition-opacity hover:bg-white disabled:opacity-0">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-0.5 text-xs text-white">
              {active + 1} / {count}
            </div>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
          {images.map((img, idx) => (
            <button
              key={img.id ?? idx}
              onClick={() => setActive(idx)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all snap-start ${
                idx === active ? 'border-primary-600 ring-1 ring-primary-600' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={productImageUrl(img.image_path)}
                alt=""
                className="h-full w-full object-contain bg-gray-100"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', whatsapp: '' })
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [orderResult, setOrderResult] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getProductBySlug(slug)
        if (!cancelled) setProduct(data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (slug) load()
    return () => { cancelled = true }
  }, [slug])

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (!product) return
    setCheckoutLoading(true)
    setCheckoutError(null)
    try {
      const result = await createCheckout({
        product_id: product.id,
        customer_name: checkoutForm.name,
        customer_email: checkoutForm.email,
        customer_whatsapp: checkoutForm.whatsapp,
      })
      setOrderResult(result)
    } catch (err) {
      setCheckoutError(err.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handleCopy = () => {
    if (!orderResult) return
    navigator.clipboard.writeText(orderResult.order_id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-card">
        <p className="text-gray-600">{error || 'Produk tidak ditemukan.'}</p>
      </div>
    )
  }

  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : product.image_path
      ? [{ id: null, image_path: product.image_path, sort_order: 0 }]
      : []

  const numPrice = Number(product.price) || 0
  const numOriginal = Number(product.original_price) || 0
  const discountAmount = numOriginal > 0 && numPrice < numOriginal
    ? numOriginal - numPrice
    : 0

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900" data-aos="fade-down">
        <Settings2 className="h-6 w-6 text-primary-600" />
        Detail Produk
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: product info + checkout */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-card" data-aos="fade-right">
            <div className="mb-4">
              <ImageGallery images={images} />
            </div>
            <h2 className="mb-4 text-lg font-bold text-primary-600">{product.name}</h2>
            <div className="space-y-1 text-sm text-gray-600">
              {numOriginal > 0 && (
                <p>Harga: Rp{numOriginal.toLocaleString('id-ID')}</p>
              )}
              {discountAmount > 0 && (
                <p className="text-red-600">Diskon: -Rp{discountAmount.toLocaleString('id-ID')}</p>
              )}
            </div>
            <p className="mt-2 font-semibold">
              TOTAL : <span className="text-primary-600 font-bold text-lg">Rp{numPrice.toLocaleString('id-ID')}</span>
            </p>
          </div>

          {/* Checkout form or order result */}
          {orderResult ? (
            <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 shadow-card" data-aos="fade-up">
              <div className="mb-3 flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-semibold">Order Berhasil Dibuat!</h3>
              </div>
              <div className="mb-4 space-y-2 text-sm">
                <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-xs text-gray-500">Order ID Anda</p>
                    <p className="font-mono text-lg font-bold text-gray-900">{orderResult.order_id}</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
                <p className="text-gray-600">
                  Total: <span className="font-semibold">Rp{Number(orderResult.amount).toLocaleString('id-ID')}</span>
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">Simpan Order ID Anda!</p>
                <p className="mt-1">Gunakan Order ID untuk mengecek status pembayaran dan mengunduh template setelah pembayaran dikonfirmasi.</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/cek-transaksi"
                  className="flex-1 rounded-lg bg-primary-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Cek Status Transaksi
                </Link>
                <button
                  onClick={() => { setOrderResult(null); setCheckoutForm({ name: '', email: '', whatsapp: '' }) }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Buat Order Baru
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-card" data-aos="fade-up">
              <h3 className="mb-4 font-semibold text-gray-900">Checkout</h3>
              {checkoutError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {checkoutError}
                </div>
              )}
              <form onSubmit={handleCheckout} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Nama Anda"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={checkoutForm.whatsapp}
                    onChange={(e) => setCheckoutForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lanjutkan Ke Pembayaran
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: description */}
        <div className="rounded-xl bg-white p-6 shadow-card h-fit" data-aos="fade-left">
          <h3 className="mb-4 flex items-center gap-2 border-b-2 border-primary-600 pb-2 font-semibold text-gray-900">
            <Minus className="h-4 w-4 text-primary-600" />
            Deskripsi Produk
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            {product.description ? (
              <p className="whitespace-pre-wrap">{product.description}</p>
            ) : (
              <p className="text-gray-500">Tidak ada deskripsi.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
