'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleConfirm() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, flow_subscription_id')
          .eq('user_id', session.user.id)
          .single()

        if (profile?.flow_subscription_id) {
          router.push('/dashboard')
        } else {
          router.push('/suscripcion/registrar-tarjeta')
        }
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          router.push('/actualizar-password')
          subscription.unsubscribe()
        } else if (event === 'SIGNED_IN' && session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('flow_subscription_id')
            .eq('user_id', session.user.id)
            .single()

          if (profile?.flow_subscription_id) {
            router.push('/dashboard')
          } else {
            router.push('/suscripcion/registrar-tarjeta')
          }
          subscription.unsubscribe()
        }
      })
    }

    handleConfirm()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400">Verificando tu cuenta...</p>
      </div>
    </div>
  )
}
