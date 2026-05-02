'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleConfirm() {
      // Esperar un momento para que Supabase procese el token del hash
      await new Promise(r => setTimeout(r, 1500))

      const { data: { session }, error } = await supabase.auth.getSession()

      if (session?.user) {
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
        return
      }

      // Si no hay sesión aún, escuchar cambios
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          subscription.unsubscribe()
          router.push('/actualizar-password')
          return
        }

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          subscription.unsubscribe()
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
        }
      })

      // Timeout de seguridad — si en 10 segundos no hay sesión, ir al login
      setTimeout(() => {
        subscription.unsubscribe()
        router.push('/login?error=timeout')
      }, 10000)
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
