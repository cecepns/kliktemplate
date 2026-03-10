import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Store,
  FileCheck,
} from 'lucide-react'
import { getSettings } from '../lib/api'
import layananIcon from '../assets/layanan.png'
import testimoniIcon from '../assets/testimoni.png'
import whatsappIcon from '../assets/whatsapp.png'

const menuItems = [
  { to: '/', icon: Store, label: 'Beranda' },
  { to: '/cek-transaksi', icon: FileCheck, label: 'Cek Transaksi' },
]

function NavItem({ to, href, icon: Icon, iconSrc, label, external }) {
  const className =
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
  const activeClassName = 'bg-primary-600 text-white'
  const inactiveClassName = 'text-gray-700 hover:bg-gray-100'

  const iconEl = iconSrc ? (
    <img src={iconSrc} alt="" className="h-5 w-5 shrink-0 object-contain" />
  ) : (
    <Icon className="h-5 w-5 shrink-0" />
  )

  if (external && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} ${inactiveClassName}`}
      >
        {iconEl}
        {label}
      </a>
    )
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${className} ${isActive ? activeClassName : inactiveClassName}`
      }
    >
      {iconEl}
      {label}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const [waNumber, setWaNumber] = useState('6281234567890')
  const location = useLocation()

  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s.whatsapp_number) setWaNumber(s.whatsapp_number)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (open && onClose) {
      onClose()
    }
  }, [location.pathname])

  const otherItems = [
    { to: '/ketentuan-layanan', iconSrc: layananIcon, label: 'Ketentuan Layanan' },
    { href: `https://wa.me/${waNumber.replace(/\D/g, '')}`, iconSrc: whatsappIcon, label: 'Whatsapp', external: true },
    { to: '/testimoni', iconSrc: testimoniIcon, label: 'Testimoni' },
  ]

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed left-0 top-17 z-20 h-[calc(100vh-3.5rem)] w-64 border-r border-gray-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
        <div>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Menu
          </p>
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                iconSrc={item.iconSrc}
                label={item.label}
              />
            ))}
          </nav>
        </div>
        <div>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Lainnya
          </p>
          <nav className="space-y-0.5">
            {otherItems.map((item) => (
              <NavItem
                key={item.to || item.href}
                to={item.to}
                href={item.href}
                icon={item.icon}
                iconSrc={item.iconSrc}
                label={item.label}
                external={item.external}
              />
            ))}
          </nav>
        </div>
      </div>
      </aside>
    </>
  )
}
