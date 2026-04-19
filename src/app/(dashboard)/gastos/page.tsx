'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Download, Receipt, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Expense = {
  id: string
  description: string
  expense_category: 'fijo' | 'variable'
  document_type: 'factura' | 'boleta/otro'
  net_amount: number
  iva_amount: number
  total_amount: number
  created_at: string
  is_recurring?: boolean
}

const emptyForm = {
  description: '',
  expense_category: 'fijo' as 'fijo' | 'variable',
  document_type: 'boleta/otro' as 'factura' | 'boleta/otro',
  total_amount: '',
  has_iva: false,
  is_recurring: false,
}

export default function GastosPage() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchExpenses() }, [])

  async function fetchExpenses() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setExpenses(data ?? [])
    setLoading(false)
  }

  const total = form.total_amount ? parseFloat(form.total_amount) : 0
  const hasIva = form.document_type === 'factura'
  const netAmount = hasIva ? Math.round(total / 1.19) : total
  const ivaAmount = hasIva ? total - netAmount : 0

  async function handleSave() {
    if (!form.description || !form.total_amount) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('expenses').insert({
      user_id: user!.id,
      description: form.description,
      expense_category: form.expense_category,
      document_type: form.document_type,
      net_amount: netAmount,
      iva_amount: ivaAmount,
      total_amount: total,
      is_recurring: form.expense_category === 'fijo' ? form.is_recurring : false,
    })
    if (error) { toast.error('Error al registrar gasto'); setSaving(false); return }
    toast.success('Gasto registrado')
    setForm(emptyForm)
    setOpen(false)
    setSaving(false)
    fetchExpenses()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    toast.success('Gasto eliminado')
    fetchExpenses()
  }

  function exportCSV() {
    const headers = ['Descripción', 'Categoría', 'Documento', 'Neto', 'IVA', 'Total', 'Fecha']
    const rows = expenses.map(e => [
      e.description, e.expense_category, e.document_type,
      e.net_amount, e.iva_amount, e.total_amount,
      format(new Date(e.created_at), 'dd/MM/yyyy')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'gastos.csv'; a.click()
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const totalFijos = expenses.filter(e => e.expense_category === 'fijo').reduce((s, e) => s + e.total_amount, 0)
  const totalVariables = expenses.filter(e => e.expense_category === 'variable').reduce((s, e) => s + e.total_amount, 0)
  const totalIvaCredito = expenses.filter(e => e.document_type === 'factura').reduce((s, e) => s + e.iva_amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Gastos</h1>
          <p className="text-sm text-zinc-500 mt-1">{expenses.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-zinc-200 text-zinc-600">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar gasto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Input placeholder="Ej: Arriendo local" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="border-zinc-200" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={form.expense_category} onValueChange={v => setForm(f => ({ ...f, expense_category: v as 'fijo' | 'variable' }))}>
                      <SelectTrigger className="border-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fijo">Fijo</SelectItem>
                        <SelectItem value="variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-400">
                      {form.expense_category === 'fijo' ? 'Se prorratea en costos de producción' : 'Asociado directamente al producto'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de documento</Label>
                    <Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v as 'factura' | 'boleta/otro' }))}>
                      <SelectTrigger className="border-zinc-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="factura">Factura</SelectItem>
                        <SelectItem value="boleta/otro">Boleta / Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-zinc-400">
                      {form.document_type === 'factura' ? 'IVA recuperable para F29' : 'Sin crédito fiscal'}
                    </p>
                  </div>
                </div>

                {form.expense_category === 'fijo' && (
                  <div className="flex items-center gap-3 bg-zinc-50 rounded-lg px-3 py-2.5">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={form.is_recurring}
                      onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="is_recurring" className="text-sm text-zinc-700 font-medium cursor-pointer">
                        Repetir cada mes
                      </label>
                      <p className="text-xs text-zinc-400">Se copiará al inicio de cada mes</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Monto total ($) *</Label>
                  <Input type="number" placeholder="0" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} className="border-zinc-200 tabular-nums" />
                </div>

                {form.total_amount && (
                  <div className="bg-zinc-50 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Neto</span>
                      <span className="tabular-nums">{fmt(netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>IVA {hasIva ? '(19% — crédito fiscal)' : '(no aplica)'}</span>
                      <span className="tabular-nums">{fmt(ivaAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-zinc-900 pt-1 border-t border-zinc-200">
                      <span>Total</span>
                      <span className="tabular-nums">{fmt(total)}</span>
                    </div>
                  </div>
                )}

                <Button onClick={handleSave} disabled={saving} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                  {saving ? 'Guardando...' : 'Registrar gasto'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Gastos fijos</p>
          <p className="text-xl font-semibold tabular-nums text-rose-500 mt-1">{fmt(totalFijos)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">arriendos, sueldos, servicios</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Gastos variables</p>
          <p className="text-xl font-semibold tabular-nums text-zinc-700 mt-1">{fmt(totalVariables)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">insumos, packaging, otros</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs text-zinc-400">IVA crédito fiscal</p>
          <p className="text-xl font-semibold tabular-nums text-emerald-600 mt-1">{fmt(totalIvaCredito)}</p>
          <p className="text-xs text-zinc-400 mt-0.5">de facturas — rebaja tu F29</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando gastos...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingDown className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No hay gastos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {expenses.map(e => (
              <div key={e.id} className="px-5 py-3.5 hover:bg-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-zinc-300 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{e.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-xs ${e.expense_category === 'fijo' ? 'border-rose-200 text-rose-500' : 'border-zinc-200 text-zinc-400'}`}>
                        {e.expense_category}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-zinc-200 text-zinc-400">
                        {e.document_type}
                      </Badge>
                      {e.is_recurring && (
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-400">
                          ↻ mensual
                        </Badge>
                      )}
                      <span className="text-xs text-zinc-400">
                        {format(new Date(e.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums text-zinc-900">{fmt(e.total_amount)}</p>
                    {e.iva_amount > 0 && (
                      <p className="text-xs text-zinc-400 tabular-nums">IVA: {fmt(e.iva_amount)}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-300 hover:text-rose-400" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
