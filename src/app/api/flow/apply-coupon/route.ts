import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function flowSign(params: Record<string, string>, secret: string) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(toSign).digest('hex')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { couponId, subscriptionId } = await request.json()
  if (!couponId || !subscriptionId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!

  const params: Record<string, string> = { apiKey, subscriptionId, couponId }
  params.s = flowSign(params, secretKey)

  const body = new URLSearchParams(params)
  const res = await fetch(`${apiUrl}/subscription/addCoupon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const data = await res.json()

  if (data.status === 1) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: data.message ?? 'Error al aplicar cupón' }, { status: 400 })
}
