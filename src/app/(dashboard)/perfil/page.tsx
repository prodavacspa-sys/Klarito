'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, User, Building2, CreditCard, Tag } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [flowSubscriptionId, setFlowSubscriptionId] = useState('')

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email ?? '')
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (data) {
      setBusinessName(data.business_name ?? '')
      setSubscriptionStatus(data.subscription_status)
      setFlowSubscriptionId(data.flow_subscription_id ?? '')
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

  async function handleApplyCoupon() {
    if (!couponCode.trim()) { toast.error('Ingresa un código de cupón'); return }
    setApplyingCoupon(true)
    try {
      const res = await fetch('/api/flow/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: couponCode.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        if (data.free) {
          toast.success('¡Plan activado gratuitamente!')
          setSubscriptionStatus('active')
        } else {
          toast.success('Cupón aplicado correctamente')
        }
        setCouponCode('')
        setTimeout(() => window.location.reload(), 1500)
      } else {
        toast.error(data.error ?? 'Cupón inválido')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setApplyingCoupon(false)
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
          {subscriptionStatus !== 'active' && (
            <>
              <Button
                className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
                onClick={() => setShowPaymentModal(true)}
              >
                Activar suscripción — $5.170/mes
              </Button>

              <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="text-center">Activar suscripción Klarito</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2 text-center">
                    <div className="text-4xl font-bold text-zinc-900">Klarito</div>
                    <p className="text-sm text-zinc-500">Tus finanzas, en orden.</p>
                    <p className="text-xs text-zinc-400">Servicio desarrollado por <strong className="text-zinc-600">Prodavac SpA</strong></p>
                    <div className="bg-zinc-50 rounded-xl p-4 space-y-2 text-left">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Plan mensual</span>
                        <span className="font-medium tabular-nums">$5.170/mes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Período de prueba</span>
                        <span className="font-medium text-emerald-600">7 días gratis</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">IVA incluido</span>
                        <span className="font-medium">✓</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400">Serás redirigido a nuestra plataforma de pago segura para registrar tu tarjeta. No se realizará ningún cobro durante los primeros 7 días.</p>
                    <Button
                      className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
                      disabled={loadingPayment}
                      onClick={async () => {
                        setLoadingPayment(true)
                        try {
                          const res = await fetch('/api/flow/subscribe', { method: 'POST' })
                          const data = await res.json()
                          if (data.redirectUrl) window.location.href = data.redirectUrl
                          else toast.error('Error al iniciar suscripción')
                        } catch {
                          toast.error('Error de conexión')
                        }
                        setLoadingPayment(false)
                      }}
                    >
                      {loadingPayment ? 'Conectando...' : 'Continuar al pago seguro →'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="border-zinc-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-zinc-400" />
              Cupón de descuento
            </CardTitle>
            <CardDescription>Ingresa un código para obtener descuento o activar tu plan gratuitamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Ej: 6372"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="border-zinc-200 font-mono"
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={applyingCoupon}
                className="bg-zinc-900 hover:bg-zinc-700 text-white flex-shrink-0"
              >
                {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
              </Button>
            </div>
            <p className="text-xs text-zinc-400">Ingresa el código numérico del cupón</p>
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
