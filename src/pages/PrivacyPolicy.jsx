import { useState, useEffect } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { getSettings } from '../lib/api'

export default function PrivacyPolicy() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then((s) => setContent(s.privacy_policy ?? ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-card">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
        <Shield className="h-6 w-6 text-primary-600" />
        Kebijakan Privasi
      </h1>
      <div className="prose prose-sm max-w-none text-gray-600">
        {content ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <p className="text-gray-400">Belum ada kebijakan privasi.</p>
        )}
      </div>
    </div>
  )
}

