import { Shield } from 'lucide-react'

export default function KetentuanLayanan() {
  return (
    <div
      className="rounded-xl bg-white p-8 shadow-card"
      data-aos="fade-up"
    >
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
        <Shield className="h-6 w-6 text-primary-600" />
        Ketentuan Layanan
      </h1>
      <p className="text-gray-600">
        Syarat dan ketentuan penggunaan layanan kliktemplate.com.
      </p>
    </div>
  )
}
