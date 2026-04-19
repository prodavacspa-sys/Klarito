import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sales } = await supabase
    .from('sales')
    .select('*, sale_items(quantity, unit_price, product:products(name))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const totalMes = sales
    ?.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, s) => sum + s.total_amount, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Ventas</h1>
          <p className="text-sm text-zinc-500 mt-1">Este mes: <span className="text-emerald-600 font-medium tabular-nums">{fmt(totalMes)}</span></p>
        </div>
        <Link href="/ventas/nueva">
          <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nueva venta
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {!sales || sales.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 text-sm">No hay ventas registradas.</p>
            <Link href="/ventas/nueva">
              <Button size="sm" className="mt-3 bg-zinc-900 hover:bg-zinc-700 text-white">Registrar primera venta</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {sales.map(sale => (
              <div key={sale.id} className="px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">{fmt(sale.total_amount)}</span>
                      <Badge variant="outline" className="text-xs border-zinc-200 text-zinc-400">
                        {sale.notes?.replace('Pago: ', '') ?? 'efectivo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {format(new Date(sale.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {sale.sale_items?.map((i: any) => `${i.quantity}× ${i.product?.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Neto: <span className="tabular-nums">{fmt(sale.net_amount)}</span></p>
                    <p className="text-xs text-zinc-400">IVA: <span className="tabular-nums">{fmt(sale.iva_amount)}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
