import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureReferralCode } from '@/lib/referrals'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const code = await ensureReferralCode(user.id)
  return NextResponse.json({ code })
}
