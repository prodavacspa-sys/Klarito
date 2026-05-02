'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function RegistrarTarjetaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    setLoading(true)
    try {
      const res = await fetch('/api/flow/subscribe', { method: 'POST' })
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else {
        toast.error('Error al conectar con el sistema de pago')
        setLoading(false)
      }
    } catch {
      toast.error('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Klarito</h1>
          <p className="text-sm text-zinc-500 mt-1">Tus finanzas, en orden.</p>
        </div>

        <Card className="border-zinc-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Registra tu medio de pago</CardTitle>
            <CardDescription>Necesario para activar tu cuenta después del período de prueba</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Clock className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span><strong>7 días gratis</strong> — explora Klarito sin costo</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <CreditCard className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                <span>Después se cobra <strong>$5.170/mes</strong> automáticamente</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Shield className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                <span>Cancela cuando quieras desde tu perfil</span>
              </div>
            </div>

            <Button
              className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? 'Conectando con Flow...' : 'Registrar tarjeta y comenzar prueba'}
            </Button>

            <p className="text-xs text-zinc-400 text-center">
              Serás redirigido a Flow.cl para ingresar tu tarjeta de forma segura
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
