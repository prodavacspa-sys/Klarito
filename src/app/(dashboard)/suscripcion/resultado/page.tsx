'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ResultadoSuscripcionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    async function check() {
      const token = searchParams.get('token')
      if (!token) { setStatus('error'); return }

      await new Promise(r => setTimeout(r, 2000))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('error'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status')
        .eq('user_id', user.id)
        .single()

      setStatus(profile?.subscription_status === 'active' ? 'success' : 'error')
    }
    check()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm border-zinc-200 shadow-none text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 text-zinc-400 mx-auto animate-spin" />
              <p className="text-sm text-zinc-500">Verificando suscripción...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h2 className="text-lg font-medium text-zinc-900">¡Suscripción activa!</h2>
              <p className="text-sm text-zinc-500">Tu cuenta Klarito está activa. Se cobrará $5.170 cada mes.</p>
              <Button className="w-full bg-zinc-900 hover:bg-zinc-700 text-white" onClick={() => router.push('/dashboard')}>
                Ir al dashboard
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h2 className="text-lg font-medium text-zinc-900">Algo salió mal</h2>
              <p className="text-sm text-zinc-500">No pudimos confirmar tu suscripción. Intenta nuevamente.</p>
              <Button variant="outline" className="w-full border-zinc-200" onClick={() => router.push('/perfil')}>
                Volver a intentar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
