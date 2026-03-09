import { Link } from 'react-router-dom'
import { Package, Tags, Star, ShoppingBag, Settings } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/admin/products"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-primary-100 p-3">
            <Package className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Kelola Produk</h2>
            <p className="text-sm text-gray-500">Tambah, edit, atau hapus produk</p>
          </div>
        </Link>
        <Link
          to="/admin/categories"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-primary-100 p-3">
            <Tags className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Kelola Kategori</h2>
            <p className="text-sm text-gray-500">Tambah, edit, atau hapus kategori</p>
          </div>
        </Link>
        <Link
          to="/admin/testimonials"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-primary-100 p-3">
            <Star className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Kelola Testimoni</h2>
            <p className="text-sm text-gray-500">Tambah, edit, atau hapus testimoni</p>
          </div>
        </Link>
        <Link
          to="/admin/orders"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-primary-100 p-3">
            <ShoppingBag className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Kelola Transaksi</h2>
            <p className="text-sm text-gray-500">Lihat & kelola order pembeli</p>
          </div>
        </Link>
        <Link
          to="/admin/settings"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="rounded-lg bg-primary-100 p-3">
            <Settings className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Pengaturan</h2>
            <p className="text-sm text-gray-500">Atur pengumuman & pengaturan situs</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
