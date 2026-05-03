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

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { couponId } = await request.json()
  if (!couponId) return NextResponse.json({ error: 'Ingresa un código' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, business_name, flow_subscription_id')
    .eq('user_id', user.id)
    .single()

  const email = profile?.email ?? user.email!
  const name = profile?.business_name ?? 'Usuario'
  const planId = process.env.FLOW_PLAN_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  // Si ya tiene suscripción, aplicar cupón directamente
  if (profile?.flow_subscription_id) {
    const result = await flowPost('/subscription/addCoupon', {
      subscriptionId: profile.flow_subscription_id,
      couponId,
    })
    if (result.subscriptionId) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: result.message ?? 'Cupón inválido' }, { status: 400 })
  }

  // Sin suscripción: crear cliente y suscribir con cupón
  let customerId: string
  const newCustomer = await flowPost('/customer/create', {
    name, email, externalId: user.id,
  })

  if (newCustomer.customerId) {
    customerId = newCustomer.customerId
  } else {
    // Cliente ya existe, buscarlo
    const list = await flowPost('/customer/list', { filter: email, start: '0', limit: '5' })
    const customers = list.data ?? []
    if (customers.length > 0) {
      customerId = customers[0].customerId
    } else {
      return NextResponse.json({ error: 'No se pudo crear el cliente' }, { status: 400 })
    }
  }

  // Crear suscripción con cupón
  const subscription = await flowPost('/subscription/create', {
    planId,
    customerId,
    couponId,
    urlConfirmation: `${siteUrl}/api/flow/webhook`,
  })

  if (subscription.subscriptionId) {
    await supabase.from('profiles')
      .update({
        subscription_status: 'active',
        flow_subscription_id: subscription.subscriptionId
      })
      .eq('user_id', user.id)
    return NextResponse.json({ ok: true, free: true })
  }

  return NextResponse.json({ error: subscription.message ?? 'Cupón inválido' }, { status: 400 })
}
