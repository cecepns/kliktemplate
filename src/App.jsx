import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import LayananJasa from './pages/LayananJasa'
import CekTransaksi from './pages/CekTransaksi'
import KetentuanLayanan from './pages/KetentuanLayanan'
import Testimoni from './pages/Testimoni'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminTestimonials from './pages/admin/AdminTestimonials'
import AdminOrders from './pages/admin/AdminOrders'
import AdminSettings from './pages/admin/AdminSettings'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="/*" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="produk/:slug" element={<ProductDetail />} />
          <Route path="layanan-jasa" element={<LayananJasa />} />
          <Route path="cek-transaksi" element={<CekTransaksi />} />
          <Route path="ketentuan-layanan" element={<KetentuanLayanan />} />
          <Route path="testimoni" element={<Testimoni />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
