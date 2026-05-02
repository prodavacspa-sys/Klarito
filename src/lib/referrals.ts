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
