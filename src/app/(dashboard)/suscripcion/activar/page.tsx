'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ActivarSuscripcionPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === '1') {
      toast.error('No pudimos activar tu suscripción. Intenta de nuevo o contáctanos.')
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      router.replace(url.pathname + url.search)
    }
  }, [router])

  // Trackear inicio de checkout (una sola vez al montar)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: 5950,
        currency: 'CLP',
      })
    }
  }, [])

  async function handleActivar() {
    setLoading(true)
    try {
      const res = await fetch('/api/flow/subscribe', { method: 'POST' })
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.error === 'ya_suscrito') {
        toast.success('Tu suscripción ya está activa')
        router.push('/dashboard')
      } else {
        toast.error('Error al iniciar suscripción')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900">Klarito</h1>
          <p className="text-zinc-500">Tus finanzas, en orden.</p>
          <p className="text-xs text-zinc-400">Servicio desarrollado por <strong className="text-zinc-600">Prodavac SpA</strong></p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Plan mensual neto</span>
              <span className="font-medium tabular-nums">$5.000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">IVA (19%)</span>
              <span className="font-medium tabular-nums">$950</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-zinc-100 pt-3">
              <span className="text-zinc-900">Total mensual</span>
              <span className="tabular-nums">$5.950</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Período de prueba</span>
              <span className="font-medium text-emerald-600">7 días gratis</span>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
            <p className="text-xs text-zinc-500 font-medium">¿Qué incluye?</p>
            {[
              'Dashboard con punto de equilibrio',
              'Inventario ilimitado',
              'Registro de ventas y gastos',
              'Cálculo de costos con recetas',
              'Estimación de IVA (F29)',
              'Soporte por email',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="text-emerald-500">✓</span>
                {item}
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-400 text-center">
            Serás redirigido a nuestra plataforma de pago segura para registrar tu tarjeta. No se realizará ningún cobro durante los primeros 7 días.
          </p>

          <Button
            className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
            onClick={handleActivar}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Conectando...' : 'Continuar al pago seguro →'}
          </Button>

          <p className="text-xs text-zinc-400 text-center">Cancela cuando quieras. Sin permanencia.</p>
        </div>
      </div>
    </div>
  )
}
