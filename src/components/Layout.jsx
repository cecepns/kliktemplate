import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-blue-50/60">
      <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex min-h-[calc(100vh-3.5rem)] flex-col pt-4 pl-0 lg:pl-64">
        <div className="flex min-h-full flex-1 flex-col p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
