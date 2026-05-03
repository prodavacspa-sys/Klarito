import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function flowSign(params: Record<string, string>, secret: string) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(toSign).digest('hex')
}

async function flowPost(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!
  const allParams: Record<string, string> = { ...params, apiKey }
  allParams.s = flowSign(allParams, secretKey)
  const body = new URLSearchParams(allParams)
  const res = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return res.json()
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const customerId = searchParams.get('cid')
  const planId = searchParams.get('pid')
  const userId = searchParams.get('uid')

  if (!token || !customerId || !planId || !userId) {
    return NextResponse.redirect(`${origin}/perfil?error=missing_params`)
  }

  // Suscribir al plan ahora que tiene tarjeta registrada
  const subscription = await flowPost('/subscription/create', {
    planId,
    customerId,
    urlConfirmation: `${process.env.NEXT_PUBLIC_SITE_URL}/api/flow/webhook`,
  })

  const supabase = await createClient()

  if (subscription.subscriptionId) {
    await supabase.from('profiles')
      .update({
        subscription_status: 'active',
        flow_subscription_id: subscription.subscriptionId
      })
      .eq('user_id', userId)
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/perfil?error=pago_fallido`)
}
