import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function purgeUser(supabase: SupabaseServerClient, userId: string) {
  // Borrar datos en orden correcto (respetar foreign keys)
  const { data: sales } = await supabase.from('sales').select('id').eq('user_id', userId)
  const saleIds = sales?.map(s => s.id) ?? []
  if (saleIds.length > 0) {
    await supabase.from('sale_items').delete().in('sale_id', saleIds)
  }
  await supabase.from('sales').delete().eq('user_id', userId)
  await supabase.from('expenses').delete().eq('user_id', userId)
  await supabase.from('products').delete().eq('user_id', userId)
  await supabase.from('referrals').delete().eq('referrer_user_id', userId)
  await supabase.from('referral_credits').delete().eq('user_id', userId)
  // Marcar perfil como borrado (no eliminar para mantener registro)
  await supabase.from('profiles')
    .update({
      subscription_status: 'deleted',
      email: `deleted_${userId}@klarito.cl`,
      business_name: null,
      first_name: null,
      last_name: null,
      phone: null,
      address: null,
    })
    .eq('user_id', userId)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()

  // 1. Trials que nunca agregaron tarjeta ('inactive' = nunca hubo suscripción):
  //    se marcan 'expired' a los 7 días desde el registro.
  const day7 = new Date(now)
  day7.setDate(day7.getDate() - 7)

  const { data: expiredTrials } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('subscription_status', 'inactive')
    .lte('created_at', day7.toISOString())

  for (const user of expiredTrials ?? []) {
    await supabase.from('profiles')
      .update({ subscription_status: 'expired' })
      .eq('user_id', user.user_id)
  }

  const day30 = new Date(now)
  day30.setDate(day30.getDate() - 30)

  // 2. Cuentas canceladas o con cobro fallido ('cancelled'): se purgan a los 30 días
  //    desde la cancelación/falla (cancelled_at), NO desde el registro — para no penalizar
  //    igual a un cliente que fue pagador activo por meses que a alguien que nunca convirtió.
  const { data: cancelledUsers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('subscription_status', 'cancelled')
    .lte('cancelled_at', day30.toISOString())

  for (const user of cancelledUsers ?? []) {
    await purgeUser(supabase, user.user_id)
  }

  // 3. Trials que nunca convirtieron y quedaron 'expired': se purgan 30 días después.
  const { data: expiredUsers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('subscription_status', 'expired')
    .lte('updated_at', day30.toISOString())

  for (const user of expiredUsers ?? []) {
    await purgeUser(supabase, user.user_id)
  }

  return NextResponse.json({
    ok: true,
    expired: expiredTrials?.length ?? 0,
    deletedCancelled: cancelledUsers?.length ?? 0,
    deletedExpiredTrials: expiredUsers?.length ?? 0,
  })
}
