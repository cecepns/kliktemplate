import { Handshake } from 'lucide-react'

export default function LayananJasa() {
  return (
    <div
      className="rounded-xl bg-white p-8 shadow-card"
      data-aos="fade-up"
    >
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
        <Handshake className="h-6 w-6 text-primary-600" />
        Layanan Jasa
      </h1>
      <p className="text-gray-600">
        Halaman layanan jasa. Konten dapat ditambahkan sesuai kebutuhan.
      </p>
    </div>
  )
}
