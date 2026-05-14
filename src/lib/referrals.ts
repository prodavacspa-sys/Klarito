import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

export function generateReferralCode(userId: string): string {
  return 'KL' + userId.replace(/-/g, '').substring(0, 8).toUpperCase()
}

export async function ensureReferralCode(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('user_id', userId)
    .single()
  if (!profile?.referral_code) {
    const code = generateReferralCode(userId)
    await supabase.from('profiles')
      .update({ referral_code: code })
      .eq('user_id', userId)
    return code
  }
  return profile.referral_code
}

async function flowPost(endpoint: string, params: Record<string, string>) {
  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!
  const allParams: Record<string, string> = { ...params, apiKey }
  const keys = Object.keys(allParams).sort()
  allParams.s = createHmac('sha256', secretKey).update(keys.map(k => `${k}${allParams[k]}`).join('')).digest('hex')
  const res = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(allParams).toString(),
  })
  return res.json()
}

export async function creditReferrer(flowCustomerId: string) {
  const supabase = await createClient()

  // Resolver flow_customer_id → user_id
  const { data: referredProfile } = await supabase
    .from('profiles')
    .select('user_id, referred_by')
    .eq('flow_customer_id', flowCustomerId)
    .single()

  if (!referredProfile?.referred_by) return

  // Buscar al referidor por su código
  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('referral_code', referredProfile.referred_by)
    .single()

  if (!referrerProfile) return

  // Marcar referido como completado
  await supabase.from('referrals')
    .update({ status: 'completed', credited_at: new Date().toISOString() })
    .eq('referrer_user_id', referrerProfile.user_id)
    .eq('referred_user_id', referredProfile.user_id)

  // Aplicar descuento según cantidad de referidos completados
  await updateReferralDiscount(referrerProfile.user_id)
}

export async function updateReferralDiscount(referrerUserId: string) {
  const supabase = await createClient()

  // Contar referidos completados
  const { count } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_user_id', referrerUserId)
    .eq('status', 'completed')

  const totalReferidos = count ?? 0

  const { data: profile } = await supabase
    .from('profiles')
    .select('flow_subscription_id, flow_customer_id, referral_discount')
    .eq('user_id', referrerUserId)
    .single()

  if (!profile) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  // 10+ referidos → gratis permanente
  if (totalReferidos >= 10 && profile.referral_discount < 100) {
    if (profile.flow_subscription_id) {
      const cancelResult = await flowPost('/subscription/cancel', {
        subscriptionId: profile.flow_subscription_id,
      })
      console.log('cancel result:', JSON.stringify(cancelResult))
    }
    await supabase.from('profiles')
      .update({
        referral_discount: 100,
        subscription_status: 'active',
        flow_subscription_id: null,
      })
      .eq('user_id', referrerUserId)
    return
  }

  // 5+ referidos → 50% descuento
  if (totalReferidos >= 5 && profile.referral_discount < 50) {
    // Cancelar suscripción actual
    if (profile.flow_subscription_id) {
      const cancelResult = await flowPost('/subscription/cancel', {
        subscriptionId: profile.flow_subscription_id,
      })
      console.log('cancel result:', JSON.stringify(cancelResult))
    }
    // Crear nueva suscripción con plan 50%
    const newSub = await flowPost('/subscription/create', {
      planId: 'Klarito2585',
      customerId: profile.flow_customer_id,
      urlConfirmation: `${siteUrl}/api/flow/webhook`,
    })
    console.log('new subscription result:', JSON.stringify(newSub))
    if (newSub.subscriptionId) {
      await supabase.from('profiles')
        .update({
          referral_discount: 50,
          flow_subscription_id: newSub.subscriptionId,
        })
        .eq('user_id', referrerUserId)
    }
  }
}
