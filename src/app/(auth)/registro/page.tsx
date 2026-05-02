'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function RegistroPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) localStorage.setItem('klarito_ref', ref)
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
    } else {
      const ref = localStorage.getItem('klarito_ref')
      if (ref && data.user) {
        await supabase.from('profiles')
          .update({ referred_by: ref })
          .eq('user_id', data.user.id)
        localStorage.removeItem('klarito_ref')
      }
      toast.success('Revisa tu correo para confirmar tu cuenta')
      router.push('/login')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Crear cuenta</h1>
          <p className="text-sm text-zinc-500">Empieza a usar Klarito gratis</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
