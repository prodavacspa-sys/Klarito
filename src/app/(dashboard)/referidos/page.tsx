'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Gift, Copy, Users, CheckCircle2 } from 'lucide-react'

type Referral = {
  id: string
  status: string
  created_at: string
}

export default function ReferidosPage() {
  const supabase = createClient()
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .single()

    const { data: referralData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false })

    if (!profile?.referral_code) {
      const res = await fetch('/api/referrals/ensure-code', { method: 'POST' })
      const data = await res.json()
      setReferralCode(data.code ?? '')
    } else {
      setReferralCode(profile.referral_code)
    }

    setReferrals(referralData ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount estándar de la app
  useEffect(() => { fetchData() }, [])

  const referralUrl = `https://www.klarito.cl/registro?ref=${referralCode}`
  const completedReferrals = referrals.filter(r => r.status === 'completed').length

  function copyLink() {
    navigator.clipboard.writeText(referralUrl)
    toast.success('Enlace copiado')
  }

  if (loading) return <div className="p-8 text-center text-zinc-400 text-sm">Cargando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Programa de referidos</h1>
        <p className="text-sm text-zinc-500 mt-1">Invita a otros emprendedores y gana descuentos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-zinc-200 shadow-none">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-zinc-400">Referidos completados</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900 mt-1">{completedReferrals}</p>
            <p className="text-xs text-zinc-400 mt-0.5">pagaron su primer mes</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-none">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-zinc-400">Para servicio gratis</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900 mt-1">{Math.max(0, 10 - completedReferrals)} más</p>
            <p className="text-xs text-zinc-400 mt-0.5">referidos necesitas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 shadow-none">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Tu nivel actual</p>
              <p className="text-sm font-medium text-zinc-900 mt-1">
                {completedReferrals >= 10
                  ? '🎉 ¡Servicio gratuito!'
                  : completedReferrals >= 5
                  ? '⭐ 50% de descuento'
                  : `${completedReferrals}/5 para 50% descuento`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">Pagas actualmente</p>
              <p className="text-lg font-semibold tabular-nums text-zinc-900">
                {completedReferrals >= 10
                  ? '$0'
                  : completedReferrals >= 5
                  ? '$2.975'
                  : '$5.950'}
              </p>
            </div>
          </div>
          <div className="mt-3 bg-zinc-100 rounded-full h-2">
            <div
              className="bg-zinc-900 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (completedReferrals / 10) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>0</span>
            <span>5 → 50%</span>
            <span>10 → gratis</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Gift className="h-4 w-4 text-zinc-400" />
            Tu enlace de referido
          </CardTitle>
          <CardDescription>
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">
                Invita a otros emprendedores a Klarito. Según cuántos se suscriban con tu enlace, obtienes descuentos permanentes en tu plan:
              </p>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">0 → 4 referidos</span>
                  <span className="text-zinc-400">—</span>
                  <span className="text-zinc-500">Sin descuento</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-amber-600">5 referidos</span>
                  <span className="text-zinc-400">—</span>
                  <span className="font-medium text-amber-600">50% descuento permanente ($2.975/mes)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-emerald-600">10 referidos</span>
                  <span className="text-zinc-400">—</span>
                  <span className="font-medium text-emerald-600">🎉 Plan gratuito permanente</span>
                </div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
            <span className="text-sm text-zinc-600 flex-1 truncate tabular-nums">{referralUrl}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-900 flex-shrink-0" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-zinc-400">Tu código: <strong className="text-zinc-700">{referralCode}</strong></p>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            Historial de referidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">Aún no tienes referidos. ¡Comparte tu enlace!</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-zinc-600">Referido #{r.id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-400">{new Date(r.created_at).toLocaleDateString('es-CL')}</p>
                  </div>
                  {r.status === 'completed'
                    ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completado</Badge>
                    : <Badge variant="outline" className="text-zinc-400 border-zinc-200 text-xs">Pendiente</Badge>
                  }
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
