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
    .select('email, business_name')
    .eq('user_id', user.id)
    .single()

  const email = profile?.email ?? user.email!
  const name = profile?.business_name ?? 'Usuario'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const planId = process.env.FLOW_PLAN_ID!

  let customerId: string

  // Intentar crear cliente en Flow
  const newCustomer = await flowPost('/customer/create', {
    name,
    email,
    externalId: user.id,
  })

  if (newCustomer.customerId) {
    customerId = newCustomer.customerId
  } else if (newCustomer.error?.code === 501) {
    // Ya existe — buscar por email
    const listResult = await flowPost('/customer/list', {
      filter: email,
      start: '0',
      limit: '10',
    })

    const customers = listResult.data ?? []
    const match = customers.find((c: any) => c.externalId === user.id || c.email === email)

    if (match?.customerId) {
      customerId = match.customerId
    } else if (customers.length > 0) {
      customerId = customers[0].customerId
    } else {
      return NextResponse.json({ error: 'Cliente no encontrado en Flow' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: newCustomer }, { status: 400 })
  }

  // Paso 2: registrar tarjeta y suscribir via URL de pago
  const register = await flowPost('/customer/register', {
    customerId,
    url_return: `${siteUrl}/api/flow/register-callback?customerId=${customerId}&planId=${planId}&userId=${user.id}`,
  })

  if (register.url && register.token) {
    return NextResponse.json({ redirectUrl: `${register.url}?token=${register.token}` })
  }

  return NextResponse.json({ error: register }, { status: 400 })
}
