'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Error al enviar. Intenta de nuevo.')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="font-semibold text-zinc-900">Mensaje enviado</p>
        <p className="text-sm text-zinc-500">Te responderemos a la brevedad.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="tu@email.com"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-700">Mensaje</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
          placeholder="¿En qué podemos ayudarte?"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors text-sm disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar mensaje'}
      </button>
    </form>
  )
}
