import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const cid = searchParams.get('cid')
  const planId = searchParams.get('pid')
  const userId = searchParams.get('uid')

  if (!planId || !userId) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Usar cid si viene, sino error
  const customerId = cid

  if (!customerId) {
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  const { createHmac } = await import('crypto')
  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  function sign(params: Record<string, string>) {
    const keys = Object.keys(params).sort()
    return createHmac('sha256', secretKey).update(keys.map(k => `${k}${params[k]}`).join('')).digest('hex')
  }

  async function post(endpoint: string, params: Record<string, string>) {
    const allParams: Record<string, string> = { ...params, apiKey }
    allParams.s = sign(allParams)
    const res = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(allParams).toString(),
    })
    return res.json()
  }

  const subscription = await post('/subscription/create', {
    planId,
    customerId,
    urlConfirmation: `${siteUrl}/api/flow/webhook`,
  })

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  if (subscription.subscriptionId) {
    await supabase.from('profiles')
      .update({
        subscription_status: 'active',
        flow_subscription_id: subscription.subscriptionId,
        trial_started_at: new Date().toISOString(),
        cancelled_at: null,
      })
      .eq('user_id', userId)
    return Response.redirect(`${siteUrl}/suscripcion/bienvenida`)
  }
  return Response.redirect(`${siteUrl}/suscripcion/activar?error=1`)
}

export async function POST(request: Request) {
  return GET(request)
}
