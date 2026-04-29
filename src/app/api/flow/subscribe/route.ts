import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function flowSign(params: Record<string, string>, secret: string) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(toSign).digest('hex')
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

  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!
  const planId = process.env.FLOW_PLAN_ID!

  const params: Record<string, string> = {
    apiKey,
    planId,
    customerId: user.id,
    email: profile?.email ?? user.email!,
    urlReturn: `${process.env.NEXT_PUBLIC_SITE_URL}/suscripcion/resultado`,
    urlConfirmation: `${process.env.NEXT_PUBLIC_SITE_URL}/api/flow/webhook`,
  }

  params.s = flowSign(params, secretKey)

  const body = new URLSearchParams(params)
  const res = await fetch(`${apiUrl}/subscription/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const data = await res.json()
  if (data.url && data.token) {
    return NextResponse.json({ redirectUrl: `${data.url}?token=${data.token}` })
  }

  return NextResponse.json({ error: data }, { status: 400 })
}
