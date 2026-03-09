import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tags, Star, ShoppingBag, Settings,
  ArrowLeft, LogOut, Loader2, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../lib/auth'

const navItems = [
  { to: '/admin/products', icon: Package, label: 'Produk' },
  { to: '/admin/categories', icon: Tags, label: 'Kategori' },
  { to: '/admin/testimonials', icon: Star, label: 'Testimoni' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Transaksi' },
  { to: '/admin/settings', icon: Settings, label: 'Pengaturan' },
]

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
  }`

const mobileNavLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
  }`

export default function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2 lg:gap-6">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin" className="flex items-center gap-2 font-semibold text-gray-900">
              <LayoutDashboard className="h-6 w-6 text-primary-600" />
              <span className="hidden xs:inline">Admin Panel</span>
            </Link>
            <nav className="hidden gap-1 lg:flex">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={navLinkClass}>
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden text-sm text-gray-500 md:inline">
              {user.display_name || user.username}
            </span>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali ke Situs</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-14 z-20 h-[calc(100dvh-3.5rem)] w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={mobileNavLinkClass}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-gray-200 pt-4">
            <p className="mb-3 truncate px-3 text-xs text-gray-400">
              Login sebagai <span className="font-medium text-gray-600">{user.display_name || user.username}</span>
            </p>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Situs
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  )
}
