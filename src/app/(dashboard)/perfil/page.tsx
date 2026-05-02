'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, User, Building2, CreditCard } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState('')

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email ?? '')
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (data) {
      setBusinessName(data.business_name ?? '')
      setSubscriptionStatus(data.subscription_status)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ business_name: businessName }).eq('user_id', user!.id)
    if (error) { toast.error('Error al guardar'); setSaving(false); return }
    toast.success('Perfil actualizado')
    setSaving(false)
  }

  async function handlePasswordReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/confirm`,
    })
    if (error) { toast.error('Error al enviar email'); return }
    toast.success('Revisa tu correo para cambiar la contraseña')
  }

  if (loading) return <div className="p-8 text-center text-zinc-400 text-sm">Cargando perfil...</div>

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Perfil</h1>
        <p className="text-sm text-zinc-500 mt-1">Administra los datos de tu negocio</p>
      </div>
      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-400" />
            Datos del negocio
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ej: Panadería El Sol" className="border-zinc-200" />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input value={email} disabled className="border-zinc-200 bg-zinc-50 text-zinc-400" />
              <p className="text-xs text-zinc-400">El correo no se puede cambiar</p>
            </div>
            <Button type="submit" disabled={saving} className="bg-zinc-900 hover:bg-zinc-700 text-white">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </CardContent>
        </form>
      </Card>
      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            Suscripción
          </CardTitle>
          <CardDescription>Plan actual de Klarito</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Plan mensual</p>
              <p className="text-xs text-zinc-400 mt-0.5">$5.170 / mes (IVA incluido)</p>
            </div>
            {subscriptionStatus === 'active'
              ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Activo</Badge>
              : <Badge variant="outline" className="text-zinc-400 border-zinc-200">Inactivo</Badge>
            }
          </div>
        </CardContent>
      </Card>
      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-zinc-400" />
            Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-zinc-200 text-zinc-600" onClick={handlePasswordReset}>
            Cambiar contraseña por email
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
