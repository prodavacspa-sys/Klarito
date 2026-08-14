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
import { Loader2, User, Building2, CreditCard, Tag, FileText } from 'lucide-react'

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
  const [ppmRate, setPpmRate] = useState('0')
  const [commissionDebit, setCommissionDebit] = useState('1.29')
  const [commissionCredit, setCommissionCredit] = useState('3.19')
  const [savingCommissions, setSavingCommissions] = useState(false)

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email ?? '')
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (data) {
      setBusinessName(data.business_name ?? '')
      setSubscriptionStatus(data.subscription_status)
      setPpmRate(String(data.ppm_rate ?? 0))
      if (data.commission_debit) setCommissionDebit(String(data.commission_debit))
      if (data.commission_credit) setCommissionCredit(String(data.commission_credit))
    }
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount estándar de la app
  useEffect(() => { fetchProfile() }, [])

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

  async function saveCommissions() {
    setSavingCommissions(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles')
      .update({
        commission_debit: parseFloat(commissionDebit),
        commission_credit: parseFloat(commissionCredit),
      })
      .eq('user_id', user!.id)
    toast.success('Comisiones guardadas')
    setSavingCommissions(false)
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
              <p className="text-xs text-zinc-400 mt-0.5">$5.950 / mes (IVA incluido)</p>
            </div>
            {subscriptionStatus === 'active'
              ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Activo</Badge>
              : <Badge variant="outline" className="text-zinc-400 border-zinc-200">Inactivo</Badge>
            }
          </div>
          {subscriptionStatus === 'active' && (
            <div className="border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-red-600">Cancelar suscripción</p>
              <p className="text-xs text-zinc-500">
                Si cancelas durante el período de prueba no se realizará ningún cobro.
                Tu acceso se mantendrá hasta el fin del período actual.
              </p>
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={async () => {
                  if (!confirm('¿Estás seguro que deseas cancelar tu suscripción?')) return
                  const res = await fetch('/api/flow/cancel', { method: 'POST' })
                  if (res.ok) {
                    alert('Suscripción cancelada correctamente.')
                    window.location.reload()
                  } else {
                    alert('Error al cancelar. Intenta nuevamente.')
                  }
                }}
              >
                Cancelar suscripción
              </Button>
            </div>
          )}
          {subscriptionStatus !== 'active' && (
            <>
              <a href="/suscripcion/activar" className="w-full inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Activar suscripción — $5.950/mes
              </a>

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
                        <span className="text-zinc-500">Plan mensual neto</span>
                        <span className="font-medium tabular-nums">$5.000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">IVA</span>
                        <span className="font-medium tabular-nums">$950</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-zinc-200 pt-2">
                        <span className="text-zinc-900">Total mensual</span>
                        <span className="tabular-nums">$5.950</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Período de prueba</span>
                        <span className="font-medium text-emerald-600">7 días gratis</span>
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
                          if (data.redirectUrl) {
                            window.location.href = data.redirectUrl
                          } else if (data.error === 'ya_suscrito') {
                            toast.info('Tu suscripción ya está activa')
                            setSubscriptionStatus('active')
                          } else {
                            toast.error('Error al iniciar suscripción')
                          }
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
      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            Tasa PPM
          </CardTitle>
          <CardDescription>Configura tu tasa de Pago Provisional Mensual para el estimador del Dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              value={ppmRate}
              onChange={e => setPpmRate(e.target.value)}
              className="border-zinc-200 w-24 tabular-nums"
            />
            <span className="text-sm text-zinc-500">%</span>
            <Button
              variant="outline"
              className="border-zinc-200"
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser()
                await supabase.from('profiles').update({ ppm_rate: parseFloat(ppmRate) || 0 }).eq('user_id', user!.id)
                toast.success('Tasa PPM actualizada')
              }}
            >
              Guardar
            </Button>
          </div>
          <p className="text-xs text-zinc-400">Consulta tu tasa con tu contador. Generalmente es entre 0.25% y 0.5% para Pymes.</p>
        </CardContent>
      </Card>
      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-400" />
            Comisiones de tarjeta
          </CardTitle>
          <CardDescription>
            Define el porcentaje de comisión que cobra tu procesador de pagos.
            <br />
            <strong className="text-zinc-600">Nota:</strong> en Ventas se aplica la tasa más alta entre débito y crédito directamente al precio final, para que el precio no varíe según el medio de pago. Así cuidas tu margen incluso si el cliente paga con la tarjeta más cara.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Débito (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={commissionDebit}
                  onChange={e => setCommissionDebit(e.target.value)}
                  className="border-zinc-200 tabular-nums"
                />
                <span className="text-sm text-zinc-400">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Crédito (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={commissionCredit}
                  onChange={e => setCommissionCredit(e.target.value)}
                  className="border-zinc-200 tabular-nums"
                />
                <span className="text-sm text-zinc-400">%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400">Las comisiones son + IVA y se suman al neto antes de calcular el IVA total.</p>
          <Button onClick={saveCommissions} disabled={savingCommissions} className="bg-zinc-900 hover:bg-zinc-700 text-white">
            {savingCommissions ? 'Guardando...' : 'Guardar comisiones'}
          </Button>
          {(Number(commissionDebit) === 0 || Number(commissionCredit) === 0) && (
            <p className="text-xs text-amber-500 mt-1">
              Configura tus tasas para que se apliquen automáticamente en ventas con tarjeta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
