'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export function RegistroModal({ fullWidth }: { fullWidth?: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  function openModal() {
    setOpen(true)
    setDone(false)
    setError('')
    setEmail('')
    setPassword('')
  }

  return (
    <>
      <button
        onClick={openModal}
        className={`inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-zinc-700 transition-colors text-base cursor-pointer${fullWidth ? ' w-full' : ''}`}
      >
        Empieza gratis por 7 días
        <ArrowRight className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-sm p-8 space-y-6">
            {done ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Revisa tu correo</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Te enviamos un enlace de confirmación a <strong>{email}</strong>. Al confirmarlo, te redirigiremos al pago.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-zinc-900">Crear cuenta</h2>
                  <p className="text-sm text-zinc-500">7 días gratis, luego $5.170/mes</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="tu@email.com"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear cuenta'}
                  </Button>
                </form>
                <p className="text-center text-sm text-zinc-500">
                  ¿Ya tienes cuenta?{' '}
                  <a href="/login" className="font-medium text-zinc-900 hover:underline">
                    Inicia sesión
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
