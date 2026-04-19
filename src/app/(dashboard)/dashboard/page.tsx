import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/app/dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const [
    { data: sales },
    { data: expenses },
    { data: saleItems },
    { data: profile },
  ] = await Promise.all([
    supabase.from('sales').select('net_amount, iva_amount, total_amount, created_at').eq('user_id', user!.id).gte('created_at', firstDay).lte('created_at', lastDay),
    supabase.from('expenses').select('net_amount, iva_amount, total_amount, expense_category, document_type, created_at').eq('user_id', user!.id).gte('created_at', firstDay).lte('created_at', lastDay),
    supabase.from('sale_items').select('quantity, unit_price, subtotal, product:products(cost_price)').eq('sales.user_id', user!.id),
    supabase.from('profiles').select('business_name').eq('user_id', user!.id).single(),
  ])

  const ventasNetas = sales?.reduce((s, v) => s + v.net_amount, 0) ?? 0
  const ivaDebito = sales?.reduce((s, v) => s + v.iva_amount, 0) ?? 0
  const ivaCredito = expenses?.filter(e => e.document_type === 'factura').reduce((s, e) => s + e.iva_amount, 0) ?? 0
  const gastosFijos = expenses?.filter(e => e.expense_category === 'fijo').reduce((s, e) => s + e.net_amount, 0) ?? 0
  const gastosVariables = expenses?.filter(e => e.expense_category === 'variable').reduce((s, e) => s + e.net_amount, 0) ?? 0
  const totalTransacciones = sales?.length ?? 0
  const totalVentasBrutas = sales?.reduce((s, v) => s + v.total_amount, 0) ?? 0

  const dailySales = sales?.reduce((acc: Record<string, number>, s) => {
    const day = s.created_at.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + s.total_amount
    return acc
  }, {}) ?? {}

  const chartData = Array.from({ length: now.getDate() }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), i + 1)
    const key = d.toISOString().slice(0, 10)
    return { day: i + 1, ventas: dailySales[key] ?? 0 }
  })

  return (
    <DashboardClient
      businessName={profile?.business_name ?? 'Mi Negocio'}
      ventasNetas={ventasNetas}
      ivaDebito={ivaDebito}
      ivaCredito={ivaCredito}
      gastosFijos={gastosFijos}
      gastosVariables={gastosVariables}
      chartData={chartData}
      month={now.toLocaleString('es-CL', { month: 'long', year: 'numeric' })}
      totalTransacciones={totalTransacciones}
      totalVentasBrutas={totalVentasBrutas}
    />
  )
}
