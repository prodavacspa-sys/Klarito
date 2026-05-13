'use client'

import { Button } from '@/components/ui/button'

interface TrialBannerProps {
  subscriptionStatus: string
  trialDaysLeft: number
}

export function TrialBanner({ subscriptionStatus, trialDaysLeft }: TrialBannerProps) {
  if (subscriptionStatus === 'active') {
    return (
      <div className="mt-14 md:mt-0 flex items-center justify-between px-6 py-2 bg-emerald-50 border-b border-emerald-200">
        <p className="text-sm text-emerald-700 font-medium">
          ✓ Estás en modo de prueba. Tu cuenta está activa y tienes{' '}
          <span className="font-bold">{trialDaysLeft} días gratis</span> restantes.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs"
          onClick={async () => {
            if (!confirm('¿Cancelar período de prueba? No se realizará ningún cobro.')) return
            const res = await fetch('/api/flow/cancel', { method: 'POST' })
            if (res.ok) window.location.href = '/perfil'
            else alert('Error al cancelar. Intenta nuevamente.')
          }}
        >
          Cancelar período de prueba
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-14 md:mt-0 bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
      <span className="text-sm text-amber-800">
        <strong>Estás en modo prueba.</strong> Activa tu cuenta para continuar usando Klarito después de los 7 días gratis.
      </span>
      <a href="/perfil" className="text-xs font-medium bg-amber-800 text-white px-3 py-1.5 rounded-lg hover:bg-amber-900 transition-colors">
        Activar ahora — $5.950/mes
      </a>
    </div>
  )
}
