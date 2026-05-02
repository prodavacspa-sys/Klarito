'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/actualizar-password')
      } else if (event === 'SIGNED_IN' && session) {
        router.push('/suscripcion/activar')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <p className="text-sm text-zinc-400">Verificando...</p>
    </div>
  )
}
