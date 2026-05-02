'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleConfirm() {
      await new Promise(r => setTimeout(r, 1500))

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        router.push('/dashboard')
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          subscription.unsubscribe()
          router.push('/actualizar-password')
          return
        }

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          subscription.unsubscribe()
          router.push('/dashboard')
        }
      })

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
