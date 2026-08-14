import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('flow_subscription_id, subscription_status')
    .eq('user_id', user.id)
    .single()

  if (profile?.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 })
  }

  // Estado inconsistente (activo pero sin id de suscripción en Flow): no hay nada que
  // cancelar remoto, pero igual liberamos al usuario localmente para no dejarlo bloqueado.
  if (!profile.flow_subscription_id) {
    await supabase.from('profiles')
      .update({ subscription_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!

  function sign(params: Record<string, string>) {
    const keys = Object.keys(params).sort()
    return createHmac('sha256', secretKey).update(keys.map(k => `${k}${params[k]}`).join('')).digest('hex')
  }

  const params: Record<string, string> = {
    apiKey,
    subscriptionId: profile.flow_subscription_id,
  }
  params.s = sign(params)

  const res = await fetch(`${apiUrl}/subscription/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
  const result = await res.json()

  if (result.subscriptionId) {
    await supabase.from('profiles')
      .update({ subscription_status: 'cancelled', flow_subscription_id: null, cancelled_at: new Date().toISOString() })
      .eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: result.message ?? 'Error al cancelar' }, { status: 400 })
}
