import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTrialEndingEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { secret } = await request.json()
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createClient()
  const sixDaysAgo = new Date()
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)
  const dayStart = new Date(sixDaysAgo)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(sixDaysAgo)
  dayEnd.setHours(23, 59, 59, 999)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, business_name, subscription_status, created_at')
    .eq('subscription_status', 'inactive')
    .gte('created_at', dayStart.toISOString())
    .lte('created_at', dayEnd.toISOString())

  for (const profile of profiles ?? []) {
    if (profile.email) {
      await sendTrialEndingEmail(profile.email, profile.business_name ?? 'Usuario')
    }
  }

  return NextResponse.json({ sent: profiles?.length ?? 0 })
}
