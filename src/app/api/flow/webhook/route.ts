import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function flowSign(params: Record<string, string>, secret: string) {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return createHmac('sha256', secret).update(toSign).digest('hex')
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const params: Record<string, string> = {}
  formData.forEach((value, key) => { if (key !== 's') params[key] = String(value) })

  const receivedSign = formData.get('s') as string
  const expectedSign = flowSign(params, process.env.FLOW_SECRET_KEY!)

  if (receivedSign !== expectedSign) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const event = params.event
  const customerId = params.customerId
  const subscriptionId = params.subscriptionId

  const supabase = await createClient()

  if (event === 'subscription_created' || event === 'subscription_charged') {
    await supabase.from('profiles')
      .update({ subscription_status: 'active', flow_subscription_id: subscriptionId })
      .eq('user_id', customerId)
  }

  if (event === 'subscription_cancelled' || event === 'subscription_expired') {
    await supabase.from('profiles')
      .update({ subscription_status: 'inactive' })
      .eq('user_id', customerId)
  }

  return NextResponse.json({ ok: true })
}
