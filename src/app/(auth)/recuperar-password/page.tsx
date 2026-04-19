'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function RecuperarPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/confirm`,
    })
    if (error) { toast.error('Error al enviar el correo'); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Klarito</h1>
            <p className="text-sm text-zinc-500 mt-1">Tus finanzas, en orden.</p>
          </div>
          <Card className="border-zinc-200 shadow-none text-center">
            <CardContent className="pt-8 pb-6 space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-medium text-zinc-900">Correo enviado</h2>
              <p className="text-sm text-zinc-500">Enviamos un enlace a <strong>{email}</strong>. Revisa tu bandeja de entrada y haz clic en el enlace para crear tu nueva contraseña.</p>
              <p className="text-xs text-zinc-400 mt-1">Si no lo ves, revisa tu carpeta de spam.</p>
              <Link href="/login" className="block text-sm text-zinc-400 hover:text-zinc-900 mt-3">Volver al inicio de sesión</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Klarito</h1>
          <p className="text-sm text-zinc-500 mt-1">Tus finanzas, en orden.</p>
        </div>
        <Card className="border-zinc-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Recuperar contraseña</CardTitle>
            <CardDescription>Te enviaremos un enlace para restablecer tu contraseña</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@negocio.cl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="border-zinc-200"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
              <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-900">
                Volver al inicio de sesión
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
