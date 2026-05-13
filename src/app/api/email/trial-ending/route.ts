import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTrialEndingEmail } from '@/lib/email'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()

  // Usuarios en trial que llevan 6 días (aviso día 6)
  const day6 = new Date(now)
  day6.setDate(day6.getDate() - 6)
  const day6Start = new Date(day6.setHours(0, 0, 0, 0)).toISOString()
  const day6End = new Date(day6.setHours(23, 59, 59, 999)).toISOString()

  const { data: trialEndingUsers } = await supabase
    .from('profiles')
    .select('email, business_name, flow_subscription_id')
    .eq('subscription_status', 'active')
    .gte('created_at', day6Start)
    .lte('created_at', day6End)

  for (const user of trialEndingUsers ?? []) {
    await sendTrialEndingEmail(user.email, user.business_name ?? 'Emprendedor')
  }

  return NextResponse.json({ ok: true, processed: trialEndingUsers?.length ?? 0 })
}
