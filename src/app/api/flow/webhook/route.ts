import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendPaymentSuccessEmail, sendPaymentFailedEmail } from '@/lib/email'
import { creditReferrer } from '@/lib/referrals'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, business_name')
    .eq('flow_customer_id', customerId)
    .single()

  const email = profile?.email ?? ''
  const businessName = profile?.business_name ?? 'Usuario'

  if (event === 'subscription_created') {
    await supabase.from('profiles')
      .update({
        subscription_status: 'active',
        flow_subscription_id: subscriptionId,
        trial_started_at: new Date().toISOString(),
        cancelled_at: null,
      })
      .eq('flow_customer_id', customerId)
    await sendWelcomeEmail(email, businessName)
  }

  if (event === 'subscription_charged') {
    await supabase.from('profiles')
      .update({ subscription_status: 'active', cancelled_at: null })
      .eq('flow_customer_id', customerId)
    await sendPaymentSuccessEmail(email, businessName)
    await creditReferrer(customerId) // customerId es flow_customer_id, ya corregido en referrals.ts
  }

  // 'cancelled', 'expired' y 'charge_failed' se tratan igual: dejan de estar activos y
  // arrancan su propio período de gracia de 30 días (cancelled_at), separado del trial
  // original que nunca convirtió (created_at). Ver cron manage-accounts.
  if (event === 'subscription_cancelled' || event === 'subscription_expired') {
    await supabase.from('profiles')
      .update({ subscription_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('flow_customer_id', customerId)
  }

  if (event === 'subscription_charge_failed') {
    await supabase.from('profiles')
      .update({ subscription_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('flow_customer_id', customerId)
    await sendPaymentFailedEmail(email, businessName)
  }

  return NextResponse.json({ ok: true })
}
