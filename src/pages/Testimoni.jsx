import { useState, useEffect } from 'react'
import { Star, Quote } from 'lucide-react'
import { getTestimonials } from '../lib/api'

export default function Testimoni() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getTestimonials()
        if (!cancelled) setList(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setList([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const formatDate = (d) => {
    if (!d) return ''
    const date = new Date(d)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6" data-aos="fade-up">
      <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
        <Star className="h-6 w-6 text-primary-600" />
        Testimoni
      </h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center shadow-card">
          <Quote className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-gray-500">Belum ada testimoni.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-card"
              data-aos="fade-up"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{t.author_name}</span>
                {t.rating != null && t.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium text-gray-600">{t.rating}</span>
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-gray-600">{t.content}</p>
              {t.created_at && (
                <p className="mt-3 text-xs text-gray-400">{formatDate(t.created_at)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
