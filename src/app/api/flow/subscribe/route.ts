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

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const planId = process.env.FLOW_PLAN_ID!

  // Paso 1: obtener o crear customerId en Flow
  let customerId: string

  // Verificar si ya tenemos el flow_customer_id guardado
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, business_name, flow_subscription_id')
    .eq('user_id', user.id)
    .single()

  // Intentar crear cliente — si ya existe Flow devuelve error 501
  const newCustomer = await flowPost('/customer/create', {
    name: profile?.business_name ?? 'Usuario',
    email: profile?.email ?? user.email!,
    externalId: user.id,
  })

  if (newCustomer.customerId) {
    customerId = newCustomer.customerId
  } else if (newCustomer.error?.code === 501) {
    // Cliente ya existe — buscar por email
    const existing = await flowPost('/customer/list', {
      filter: profile?.email ?? user.email!,
    })
    if (existing.data?.[0]?.customerId) {
      customerId = existing.data[0].customerId
    } else {
      return NextResponse.json({ error: 'No se pudo obtener cliente Flow' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: newCustomer }, { status: 400 })
  }

  // Paso 2: suscribir cliente al plan
  const subscription = await flowPost('/subscription/create', {
    planId,
    customerId,
    urlReturn: `${siteUrl}/suscripcion/resultado`,
    urlConfirmation: `${siteUrl}/api/flow/webhook`,
  })

  if (subscription.url && subscription.token) {
    return NextResponse.json({ redirectUrl: `${subscription.url}?token=${subscription.token}` })
  }

  return NextResponse.json({ error: subscription }, { status: 400 })
}
