'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ActivarPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    async function initFlow() {
      try {
        const res = await fetch('/api/flow/subscribe', { method: 'POST' })
        const data = await res.json()
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        } else {
          setError('No se pudo iniciar el pago. Por favor intenta desde tu perfil.')
        }
      } catch {
        setError('Error de conexión. Por favor intenta de nuevo.')
      }
    }
    initFlow()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-sm text-zinc-500">{error}</p>
          <Button onClick={() => router.push('/perfil')} className="bg-zinc-900 hover:bg-zinc-700 text-white">
            Ir a mi perfil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400 mx-auto" />
        <p className="text-sm text-zinc-500">Preparando tu suscripción...</p>
      </div>
    </div>
  )
}
