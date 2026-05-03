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

async function flowGet(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!
  const allParams: Record<string, string> = { ...params, apiKey }
  allParams.s = flowSign(allParams, secretKey)
  const qs = new URLSearchParams(allParams).toString()
  const res = await fetch(`${apiUrl}${endpoint}?${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return res.json()
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Obtener perfil — fallback a datos del auth si no existe
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, business_name')
    .eq('user_id', user.id)
    .single()

  console.log('profile:', JSON.stringify(profile), 'profileError:', profileError?.message)

  const email = profile?.email ?? user.email!
  const name = profile?.business_name ?? user.email ?? 'Usuario'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const planId = process.env.FLOW_PLAN_ID!

  console.log('email:', email, 'name:', name, 'siteUrl:', siteUrl, 'planId:', planId)

  let customerId: string

  // Intentar crear cliente
  const newCustomer = await flowPost('/customer/create', {
    name,
    email,
    externalId: user.id,
  })

  console.log('customer/create:', JSON.stringify(newCustomer))

  if (newCustomer.customerId) {
    customerId = newCustomer.customerId
  } else {
    // Buscar por email en customer/list
    const list = await flowGet('/customer/list', {
      filter: email,
      start: '0',
      limit: '5',
    })

    console.log('customer/list:', JSON.stringify(list))

    const customers = list.data ?? []
    if (customers.length > 0) {
      customerId = customers[0].customerId
    } else {
      return NextResponse.json({
        error: 'No se pudo obtener cliente Flow',
        detail: { newCustomer, list },
      }, { status: 400 })
    }
  }

  const fullReturnUrl = `${siteUrl}/api/flow/register-callback?cid=${customerId}&pid=${planId}&uid=${user.id}`
  console.log('fullReturnUrl:', fullReturnUrl)

  const register = await flowPost('/customer/register', {
    customerId,
    url_return: fullReturnUrl,
  })

  console.log('register response:', JSON.stringify(register))

  if (register.url && register.token) {
    return NextResponse.json({ redirectUrl: `${register.url}?token=${register.token}` })
  }

  return NextResponse.json({ error: register }, { status: 400 })
}
