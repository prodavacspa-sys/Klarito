'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Package, ShoppingCart, Receipt, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BienvenidaPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard'), 8000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />

        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">¡Bienvenido a Klarito!</h1>
          <p className="text-zinc-500 mt-2">Tu suscripción está activa. Serás redirigido al dashboard en unos segundos.</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5 text-left space-y-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">¿Por dónde empezar?</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <Package className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <span>Agrega tus productos en <strong>Inventario</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <Receipt className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <span>Registra tus gastos fijos en <strong>Gastos</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <ShoppingCart className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <span>Registra tu primera venta en <strong>Ventas</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <TrendingUp className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <span>Revisa tu punto de equilibrio en el <strong>Dashboard</strong></span>
            </div>
          </div>
        </div>

        <Button className="w-full bg-zinc-900 hover:bg-zinc-700 text-white" onClick={() => router.push('/dashboard')}>
          Ir al dashboard ahora
        </Button>
        <p className="text-xs text-zinc-400">Redirigiendo automáticamente en 8 segundos...</p>
      </div>
    </div>
  )
}
