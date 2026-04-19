'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, FileText, AlertCircle } from 'lucide-react'

interface Props {
  businessName: string
  ventasNetas: number
  ivaDebito: number
  ivaCredito: number
  gastosFijos: number
  gastosVariables: number
  chartData: { day: number; ventas: number }[]
  month: string
  totalTransacciones: number
  totalVentasBrutas: number
}

export function DashboardClient({ businessName, ventasNetas, ivaDebito, ivaCredito, gastosFijos, gastosVariables, chartData, month, totalTransacciones, totalVentasBrutas }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const utilidadBruta = ventasNetas - gastosVariables
  const resultado = utilidadBruta - gastosFijos
  const ivaResultado = ivaDebito - ivaCredito

  const pctEquilibrio = gastosFijos > 0 ? Math.min(Math.round((utilidadBruta / gastosFijos) * 100), 100) : 0
  const equilibrioAlcanzado = utilidadBruta >= gastosFijos

  const gaugeColor = pctEquilibrio < 50 ? '#f43f5e' : pctEquilibrio < 85 ? '#f59e0b' : '#10b981'

  const totalVentas = chartData.reduce((s, d) => s + d.ventas, 0)
  const ticketPromedio = totalTransacciones > 0 ? Math.round(totalVentasBrutas / totalTransacciones) : 0
  const ventasRestantes = ticketPromedio > 0 ? Math.ceil(Math.max(0, gastosFijos - utilidadBruta) / ticketPromedio) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1 capitalize">{month} — {businessName}</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Ventas netas</p>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 mt-1">{fmt(ventasNetas)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">sin IVA</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Gastos fijos</p>
          <p className="text-xl font-semibold tabular-nums text-rose-500 mt-1">{fmt(gastosFijos)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">arriendos, sueldos</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Gastos variables</p>
          <p className="text-xl font-semibold tabular-nums text-zinc-700 mt-1">{fmt(gastosVariables)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">insumos, otros</p>
        </div>
        <div className={`rounded-xl p-4 border ${resultado >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className="text-xs text-zinc-400">Resultado neto</p>
          <p className={`text-xl font-semibold tabular-nums mt-1 ${resultado >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(resultado)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{resultado >= 0 ? 'utilidad del mes' : 'pérdida del mes'}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Velocímetro punto de equilibrio */}
        <div className="col-span-2 bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-900">Punto de equilibrio</p>
              <p className="text-xs text-zinc-400 mt-0.5">¿Cuánto has cubierto de tus costos fijos?</p>
            </div>
            {equilibrioAlcanzado
              ? <TrendingUp className="h-5 w-5 text-emerald-500" />
              : <TrendingDown className="h-5 w-5 text-rose-400" />
            }
          </div>

          {/* Gauge SVG */}
          <div className="flex flex-col items-center py-2">
            <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f4f4f5" strokeWidth="16" strokeLinecap="round" />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(pctEquilibrio / 100) * 251.2} 251.2`}
              />
              <text x="100" y="88" textAnchor="middle" className="text-2xl" style={{ fontSize: '28px', fontWeight: 700, fill: gaugeColor }}>
                {pctEquilibrio}%
              </text>
              <text x="100" y="106" textAnchor="middle" style={{ fontSize: '11px', fill: '#a1a1aa' }}>
                {equilibrioAlcanzado ? 'Equilibrio alcanzado ✓' : 'del punto de equilibrio'}
              </text>
            </svg>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Utilidad bruta</span>
              <span className={`tabular-nums font-medium ${utilidadBruta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(utilidadBruta)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Gastos fijos a cubrir</span>
              <span className="tabular-nums font-medium text-rose-500">{fmt(gastosFijos)}</span>
            </div>
            {!equilibrioAlcanzado && ventasRestantes > 0 && (
              <div className="pt-1 border-t border-zinc-200 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Monto faltante</span>
                  <span className="tabular-nums font-medium text-rose-500">{fmt(Math.max(0, gastosFijos - utilidadBruta))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600 font-medium">Ventas restantes estimadas</span>
                  <span className="tabular-nums font-semibold text-amber-600">{ventasRestantes} ventas</span>
                </div>
                <p className="text-xs text-zinc-400">con ticket promedio de {fmt(ticketPromedio)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de ventas del mes */}
        <div className="col-span-3 bg-white border border-zinc-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-900">Ventas del mes</p>
              <p className="text-xs text-zinc-400 mt-0.5">Total: <span className="tabular-nums text-emerald-600 font-medium">{fmt(totalVentas)}</span></p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `${v/1000}k` : '0'} />
              <Tooltip
                formatter={(v) => [fmt(Number(v ?? 0)), 'Ventas']}
                contentStyle={{ border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: '#f4f4f5' }}
              />
              <Bar dataKey="ventas" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#18181b" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estimador F29 */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-900">Estimador IVA — Formulario 29</p>
          <span className="text-xs text-zinc-400 ml-1">referencial, no reemplaza asesoría tributaria</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-50 rounded-lg p-4">
            <p className="text-xs text-zinc-400">IVA débito (ventas)</p>
            <p className="text-xl font-semibold tabular-nums text-zinc-900 mt-1">{fmt(ivaDebito)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">IVA cobrado a clientes</p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4">
            <p className="text-xs text-zinc-400">IVA crédito (facturas)</p>
            <p className="text-xl font-semibold tabular-nums text-emerald-600 mt-1">− {fmt(ivaCredito)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">IVA pagado con facturas</p>
          </div>
          <div className={`rounded-lg p-4 border ${ivaResultado > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className="text-xs text-zinc-400">Resultado estimado</p>
            <p className={`text-xl font-semibold tabular-nums mt-1 ${ivaResultado > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{fmt(Math.abs(ivaResultado))}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{ivaResultado > 0 ? 'a pagar al SII' : 'remanente a favor'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
