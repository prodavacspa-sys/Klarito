import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const getEnv = () => ({
  apiKey: process.env.FLOW_API_KEY!,
  secretKey: process.env.FLOW_SECRET_KEY!,
  apiUrl: process.env.FLOW_API_URL!,
  planId: process.env.FLOW_PLAN_ID!,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL!,
})

function flowSign(params: Record<string, string>, secret: string) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(toSign).digest('hex')
}

async function flowPost(endpoint: string, params: Record<string, string>) {
  const { apiKey, secretKey, apiUrl } = getEnv()
  const allParams: Record<string, string> = { ...params, apiKey }
  allParams.s = flowSign(allParams, secretKey)
  const res = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(allParams).toString(),
  })
  return res.json()
}

async function flowGet(endpoint: string, params: Record<string, string>) {
  const { apiKey, secretKey, apiUrl } = getEnv()
  const allParams: Record<string, string> = { ...params, apiKey }
  allParams.s = flowSign(allParams, secretKey)
  const res = await fetch(`${apiUrl}${endpoint}?${new URLSearchParams(allParams).toString()}`)
  return res.json()
}

export async function POST() {
  console.log('ENV CHECK - FLOW_API_KEY length:', process.env.FLOW_API_KEY?.length ?? 'UNDEFINED')
  console.log('ENV CHECK - FLOW_SECRET_KEY length:', process.env.FLOW_SECRET_KEY?.length ?? 'UNDEFINED')
  console.log('ENV CHECK - FLOW_API_URL:', process.env.FLOW_API_URL)
  console.log('ENV CHECK - FLOW_PLAN_ID:', process.env.FLOW_PLAN_ID)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('=== SUBSCRIBE START ===')
  console.log('user.id:', user?.id)
  console.log('user.email:', user?.email)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { planId, siteUrl } = getEnv()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, business_name, flow_subscription_id, subscription_status, flow_customer_id')
    .eq('user_id', user.id)
    .single()
  console.log('profile:', JSON.stringify(profile))
  console.log('profileError:', profileError?.message)

  // Si ya tiene suscripción activa en Supabase
  if (profile?.subscription_status === 'active' && profile?.flow_subscription_id) {
    return NextResponse.json({ error: 'ya_suscrito' }, { status: 400 })
  }

  const email = profile?.email ?? user.email!
  const name = profile?.business_name ?? email
  const returnUrl = `${siteUrl}/api/flow/register-callback?pid=${planId}&uid=${user.id}`

  // PASO 1: Obtener o crear cliente en Flow
  let customerId: string
  let customerData: any = null

  if (profile?.flow_customer_id) {
    customerId = profile.flow_customer_id
  } else {
    // Intentar crear cliente
    const newCustomer = await flowPost('/customer/create', { name, email, externalId: user.id })
    console.log('customer/create result:', JSON.stringify(newCustomer))

    if (newCustomer.customerId) {
      customerId = newCustomer.customerId
      await supabase.from('profiles').update({ flow_customer_id: customerId }).eq('user_id', user.id)
    } else {
      return NextResponse.json({ error: 'No se pudo crear cliente en Flow', detail: newCustomer }, { status: 400 })
    }
  }

  // PASO 2: Obtener datos completos del cliente si no los tenemos
  if (!customerData) {
    customerData = await flowGet('/customer/get', { customerId })
  }

  // PASO 3: Según estado del cliente, decidir acción
  const returnUrlWithCid = `${returnUrl}&cid=${customerId}`

  if (!customerData.creditCardType) {
    // Sin tarjeta — enviar a registrar tarjeta
    console.log('url_return que se envía a Flow:', returnUrlWithCid)
    const register = await flowPost('/customer/register', {
      customerId,
      url_return: returnUrlWithCid,
    })
    console.log('customer/register result:', JSON.stringify(register))
    if (register.url && register.token) {
      return NextResponse.json({ redirectUrl: `${register.url}?token=${register.token}` })
    }
    return NextResponse.json({ error: 'No se pudo generar link de registro de tarjeta', detail: register }, { status: 400 })
  }

  // Con tarjeta — crear suscripción directamente
  const subscription = await flowPost('/subscription/create', {
    planId,
    customerId,
    urlConfirmation: `${siteUrl}/api/flow/webhook`,
  })

  if (subscription.subscriptionId) {
    await supabase.from('profiles')
      .update({ subscription_status: 'active', flow_subscription_id: subscription.subscriptionId })
      .eq('user_id', user.id)
    return NextResponse.json({ redirectUrl: `${siteUrl}/suscripcion/bienvenida` })
  }

  return NextResponse.json({ error: subscription.message ?? 'Error al crear suscripción', detail: subscription }, { status: 400 })
}
