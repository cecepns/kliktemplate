import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { productImageUrl } from '../lib/api'

export default function ProductCard({ product, ...rest }) {
  const discountPercent =
    product.original_price > 0 && product.price < product.original_price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-card transition-shadow hover:shadow-cardHover"
      data-aos="fade-up"
      {...rest}
    >
      <div className="relative aspect-video bg-gray-100">
        <img
          src={productImageUrl(
            product.images?.length ? product.images[0].image_path : product.image_path
          )}
          alt={product.name}
          className="h-full w-full object-cover object-top transition-transform group-hover:scale-105"
        />
        {!!product.is_new && (
          <span className="absolute right-2 top-2 rounded bg-primary-600 px-2 py-0.5 text-xs font-medium text-white">
            Terbaru
          </span>
        )}
        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            -{discountPercent}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">{product.name}</h3>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-emerald-600">
            Rp{Number(product.price).toLocaleString('id-ID')}
          </span>
          {product.original_price > 0 && product.original_price > product.price && (
            <span className="text-sm text-gray-400 line-through">
              Rp{Number(product.original_price).toLocaleString('id-ID')}
            </span>
          )}
        </div>
        {product.sold_count != null && (
          <p className="mb-3 text-xs text-gray-500">★ {product.sold_count} Terjual</p>
        )}
        <Link
          to={`/produk/${product.slug}`}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          <ShoppingCart className="h-4 w-4" />
          Beli Sekarang
        </Link>
      </div>
    </div>
  )
}
