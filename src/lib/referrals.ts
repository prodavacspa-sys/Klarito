import { createClient } from '@/lib/supabase/server'

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

export async function creditReferrer(referredUserId: string) {
  const supabase = await createClient()

  const { data: referredProfile } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('user_id', referredUserId)
    .single()

  if (!referredProfile?.referred_by) return

  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('referral_code', referredProfile.referred_by)
    .single()

  if (!referrerProfile) return

  await supabase.from('referrals')
    .update({ status: 'completed', credited_at: new Date().toISOString() })
    .eq('referrer_user_id', referrerProfile.user_id)
    .eq('referred_user_id', referredUserId)

  const { data: credits } = await supabase
    .from('referral_credits')
    .select('total')
    .eq('user_id', referrerProfile.user_id)
    .single()

  if (credits) {
    await supabase.from('referral_credits')
      .update({ total: credits.total + 500 })
      .eq('user_id', referrerProfile.user_id)
  } else {
    await supabase.from('referral_credits')
      .insert({ user_id: referrerProfile.user_id, total: 500, used: 0 })
  }
}

export async function updateReferralDiscount(referrerUserId: string) {
  const supabase = await createClient()

  const { data: referrals } = await supabase
    .from('referrals')
    .select('id')
    .eq('referrer_user_id', referrerUserId)
    .eq('status', 'completed')

  const count = referrals?.length ?? 0

  const { data: profile } = await supabase
    .from('profiles')
    .select('flow_subscription_id')
    .eq('user_id', referrerUserId)
    .single()

  if (!profile?.flow_subscription_id) return

  const apiKey = process.env.FLOW_API_KEY!
  const secretKey = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!

  function flowSign(params: Record<string, string>) {
    const keys = Object.keys(params).sort()
    const toSign = keys.map(k => `${k}${params[k]}`).join('')
    return require('crypto').createHmac('sha256', secretKey).update(toSign).digest('hex')
  }

  async function flowPost(endpoint: string, params: Record<string, string>) {
    const allParams: Record<string, string> = { ...params, apiKey }
    allParams.s = flowSign(allParams)
    const body = new URLSearchParams(allParams)
    const res = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    return res.json()
  }

  if (count >= 10) {
    await flowPost('/subscription/cancel', {
      subscriptionId: profile.flow_subscription_id,
    })
    await supabase.from('profiles')
      .update({ subscription_status: 'active' })
      .eq('user_id', referrerUserId)
  } else if (count >= 5) {
    await flowPost('/subscription/addCoupon', {
      subscriptionId: profile.flow_subscription_id,
      couponId: 'KLARITO50',
    })
  }
}
