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

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, business_name, flow_subscription_id')
    .eq('user_id', user.id)
    .single()

  const email = profile?.email ?? user.email!
  const name = profile?.business_name ?? 'Usuario'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const planId = process.env.FLOW_PLAN_ID!

  // Paso 1: buscar o crear cliente en Flow
  let customerId: string

  const existingCustomer = await flowPost('/customer/getByExternalId', {
    externalId: user.id,
  })

  if (existingCustomer.customerId) {
    customerId = existingCustomer.customerId
  } else {
    const newCustomer = await flowPost('/customer/create', {
      name,
      email,
      externalId: user.id,
    })
    if (!newCustomer.customerId) {
      return NextResponse.json({ error: newCustomer }, { status: 400 })
    }
    customerId = newCustomer.customerId
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
