'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type SaleItem = { quantity: number; unit_price: number; product?: { name: string } }
type Sale = {
  id: string
  total_amount: number
  net_amount: number
  iva_amount: number
  notes?: string
  created_at: string
  sale_items?: SaleItem[]
}

export default function VentasPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => { fetchSales() }, [selectedMonth])

  async function fetchSales() {
    setLoading(true)
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))
    const { data } = await supabase
      .from('sales')
      .select('*, sale_items(quantity, unit_price, product:products(name))')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
    setSales(data ?? [])
    setLoading(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const totalMes = sales.reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Ventas</h1>
          <p className="text-sm text-zinc-500 mt-1">Total: <span className="text-emerald-600 font-medium tabular-nums">{fmt(totalMes)}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <Link href="/ventas/nueva">
            <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nueva venta
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando...</div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 text-sm">No hay ventas en este mes.</p>
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
                      {sale.sale_items?.map(i => `${i.quantity}× ${i.product?.name}`).join(', ')}
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
