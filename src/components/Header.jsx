import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import logo from '../assets/logo.png'

export default function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 py-2 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="kliktemplate.com" className="w-full h-14 object-contain" />
        </Link>
      </div>
      {/* <div className="flex items-center gap-2">
        <span className="rounded border border-gray-200 p-1.5" title="Indonesia">
          <Flag className="h-5 w-5 text-red-600" strokeWidth={2} />
        </span>
      </div> */}
    </header>
  )
}
