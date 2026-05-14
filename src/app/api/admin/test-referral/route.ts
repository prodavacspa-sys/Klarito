import { NextResponse } from 'next/server'
import { updateReferralDiscount } from '@/lib/referrals'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const userId = searchParams.get('userId')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
  }

  await updateReferralDiscount(userId)
  return NextResponse.json({ ok: true, userId })
}
