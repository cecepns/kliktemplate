import { useState, useEffect } from 'react'
import { Loader2, Save, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { getAdminSettings, updateAdminSettings, changePassword } from '../../lib/adminApi'

export default function AdminSettings() {
  const [announcement, setAnnouncement] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [ketentuanLayanan, setKetentuanLayanan] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false })

  useEffect(() => {
    setLoading(true)
    getAdminSettings()
      .then((s) => {
        setAnnouncement(s.announcement ?? '')
        setWhatsappNumber(s.whatsapp_number ?? '')
        setKetentuanLayanan(s.ketentuan_layanan ?? '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await updateAdminSettings({
        announcement,
        whatsapp_number: whatsappNumber,
        ketentuan_layanan: ketentuanLayanan,
      })
      setAnnouncement(res.announcement ?? '')
      setWhatsappNumber(res.whatsapp_number ?? '')
      setKetentuanLayanan(res.ketentuan_layanan ?? '')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError('Semua field wajib diisi')
      return
    }
    if (pwForm.newPw.length < 6) {
      setPwError('Password baru minimal 6 karakter')
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('Konfirmasi password tidak cocok')
      return
    }

    setPwSaving(true)
    try {
      await changePassword({ current_password: pwForm.current, new_password: pwForm.newPw })
      setPwSuccess(true)
      setPwForm({ current: '', newPw: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (e) {
      setPwError(e.message)
    } finally {
      setPwSaving(false)
    }
  }

  const toggleShow = (field) => setShowPw((s) => ({ ...s, [field]: !s[field] }))

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          Pengaturan berhasil disimpan.
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Teks Pengumuman (Marquee)
            </label>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Teks pengumuman yang tampil di halaman utama..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Teks ini akan tampil sebagai marquee di bagian atas halaman utama.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="6281234567890"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format internasional tanpa tanda + (contoh: 6281234567890). Digunakan untuk link WhatsApp di sidebar.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ketentuan Layanan
            </label>
            <textarea
              value={ketentuanLayanan}
              onChange={(e) => setKetentuanLayanan(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Tulis syarat dan ketentuan layanan..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Konten ini akan tampil di halaman Ketentuan Layanan.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Lock className="h-5 w-5 text-gray-500" />
          Ubah Password
        </h2>

        {pwError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pwError}
          </div>
        )}

        {pwSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Password berhasil diubah.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password Lama</label>
            <div className="relative">
              <input
                type={showPw.current ? 'text' : 'password'}
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Masukkan password saat ini"
              />
              <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showPw.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password Baru</label>
            <div className="relative">
              <input
                type={showPw.newPw ? 'text' : 'password'}
                value={pwForm.newPw}
                onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Minimal 6 karakter"
              />
              <button type="button" onClick={() => toggleShow('newPw')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showPw.newPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showPw.confirm ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Ulangi password baru"
              />
              <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwSaving}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Ubah Password
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
