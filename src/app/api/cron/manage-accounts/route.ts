import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date()

  // 1. Cerrar cuentas trial vencidas (más de 7 días sin suscripción activa)
  const day7 = new Date(now)
  day7.setDate(day7.getDate() - 7)

  const { data: expiredTrials } = await supabase
    .from('profiles')
    .select('user_id, email, business_name')
    .eq('subscription_status', 'inactive')
    .lte('created_at', day7.toISOString())

  for (const user of expiredTrials ?? []) {
    await supabase.from('profiles')
      .update({ subscription_status: 'expired' })
      .eq('user_id', user.user_id)
  }

  // 2. Borrar datos de cuentas expiradas hace más de 30 días
  const day30 = new Date(now)
  day30.setDate(day30.getDate() - 30)

  const { data: expiredUsers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('subscription_status', 'expired')
    .lte('updated_at', day30.toISOString())

  for (const user of expiredUsers ?? []) {
    // Borrar datos en orden correcto (respetar foreign keys)
    await supabase.from('sale_items').delete().in(
      'sale_id',
      (await supabase.from('sales').select('id').eq('user_id', user.user_id)).data?.map(s => s.id) ?? []
    )
    await supabase.from('sales').delete().eq('user_id', user.user_id)
    await supabase.from('expenses').delete().eq('user_id', user.user_id)
    await supabase.from('products').delete().eq('user_id', user.user_id)
    await supabase.from('referrals').delete().eq('referrer_user_id', user.user_id)
    await supabase.from('referral_credits').delete().eq('user_id', user.user_id)
    // Marcar perfil como borrado (no eliminar para mantener registro)
    await supabase.from('profiles')
      .update({
        subscription_status: 'deleted',
        email: `deleted_${user.user_id}@klarito.cl`,
        business_name: null,
        first_name: null,
        last_name: null,
        phone: null,
        address: null,
      })
      .eq('user_id', user.user_id)
  }

  return NextResponse.json({
    ok: true,
    expired: expiredTrials?.length ?? 0,
    deleted: expiredUsers?.length ?? 0
  })
}
