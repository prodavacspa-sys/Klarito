'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ActualizarPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Supabase envía el token como hash en la URL, esto lo procesa automáticamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (password.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { toast.error('Error al actualizar'); setLoading(false); return }
    toast.success('Contraseña actualizada correctamente')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-zinc-200 shadow-none text-center">
          <CardContent className="pt-8 pb-6 space-y-3">
            <p className="text-sm text-zinc-500">Verificando enlace de recuperación...</p>
          </CardContent>
        </Card>
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
            <CardTitle className="text-lg font-medium">Nueva contraseña</CardTitle>
            <CardDescription>Elige una contraseña segura de al menos 8 caracteres</CardDescription>
          </CardHeader>
          <form onSubmit={handleUpdate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="border-zinc-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input id="confirm" type="password" placeholder="Repite la contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} className="border-zinc-200" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar contraseña
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
