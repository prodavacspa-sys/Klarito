'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  expense_type: 'costo_variable_directo' | 'gasto_variable_indirecto' | 'gasto_fijo'
  expense_subcategory: string
  document_type: 'factura' | 'boleta/otro'
  net_amount: number
  iva_amount: number
  total_amount: number
  created_at: string
  is_recurring?: boolean
}

const CATEGORIAS = {
  costo_variable_directo: [
    'Ingredientes / Insumos',
    'Packaging / Envases',
    'Mano de obra directa',
    'Otro',
  ],
  gasto_variable_indirecto: [
    'Publicidad / Marketing',
    'Comisiones de venta',
    'Transporte / Delivery',
    'Plataformas de pago',
    'Materiales de oficina',
    'Otro',
  ],
  gasto_fijo: [
    'Arriendo local',
    'Sueldos y honorarios',
    'Servicios básicos',
    'Contador / Asesoría',
    'Software y suscripciones',
    'Seguros',
    'Otro',
  ],
}

const TIPO_LABELS = {
  costo_variable_directo: { label: 'Costo Variable Directo', color: 'border-orange-200 text-orange-500 bg-orange-50', desc: 'Directamente ligado a tu producción' },
  gasto_variable_indirecto: { label: 'Gasto Variable Indirecto', color: 'border-zinc-200 text-zinc-500 bg-zinc-50', desc: 'No ligado directamente a producción' },
  gasto_fijo: { label: 'Gasto Fijo', color: 'border-rose-200 text-rose-500 bg-rose-50', desc: 'Se repite todos los meses' },
}

const emptyForm = {
  description: '',
  expense_type: 'gasto_fijo' as 'costo_variable_directo' | 'gasto_variable_indirecto' | 'gasto_fijo',
  expense_subcategory: '',
  custom_subcategory: '',
  document_type: 'boleta/otro' as 'factura' | 'boleta/otro',
  total_amount: '',
  is_recurring: false,
}

export default function GastosPage() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')
  const [activeTab, setActiveTab] = useState<'todos' | 'costo_variable_directo' | 'gasto_variable_indirecto' | 'gasto_fijo'>('todos')
  const router = useRouter()

  useEffect(() => { fetchExpenses() }, [])

  async function fetchExpenses() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setExpenses(data ?? [])
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('user_id', user.id).single()
      setSubscriptionStatus(profile?.subscription_status ?? 'inactive')
    }
    setLoading(false)
  }

  const total = form.total_amount ? parseFloat(form.total_amount) : 0
  const hasIva = form.document_type === 'factura'
  const netAmount = hasIva ? Math.round(total / 1.19) : total
  const ivaAmount = hasIva ? total - netAmount : 0

  const subcategorias = CATEGORIAS[form.expense_type]
  const isOtro = form.expense_subcategory === 'Otro'

  async function handleSave() {
    if (!form.description || !form.total_amount || !form.expense_subcategory) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    if (subscriptionStatus !== 'active' && expenses.length >= 3) {
      router.push('/suscripcion/activar')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const finalSubcategory = isOtro && form.custom_subcategory ? form.custom_subcategory : form.expense_subcategory
    const { error } = await supabase.from('expenses').insert({
      user_id: user!.id,
      description: form.description,
      expense_type: form.expense_type,
      expense_category: form.expense_type === 'gasto_fijo' ? 'fijo' : 'variable',
      expense_subcategory: finalSubcategory,
      document_type: form.document_type,
      net_amount: netAmount,
      iva_amount: ivaAmount,
      total_amount: total,
      is_recurring: form.expense_type === 'gasto_fijo' ? form.is_recurring : false,
    })
    if (error) { toast.error('Error al registrar'); setSaving(false); return }
    toast.success('Registrado correctamente')
    setForm(emptyForm)
    setOpen(false)
    setSaving(false)
    fetchExpenses()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from('expenses').delete().eq('id', id)
    toast.success('Eliminado')
    fetchExpenses()
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const headers = ['Descripción', 'Tipo', 'Subcategoría', 'Documento', 'Neto', 'IVA', 'Total', 'Fecha']
    const rows = expenses.map(e => [
      e.description, e.expense_type, e.expense_subcategory, e.document_type,
      e.net_amount, e.iva_amount, e.total_amount,
      format(new Date(e.created_at), 'dd/MM/yyyy')
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
    XLSX.writeFile(wb, 'gastos-costos.xlsx')
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const totalCostoDirecto = expenses.filter(e => e.expense_type === 'costo_variable_directo').reduce((s, e) => s + e.total_amount, 0)
  const totalGastoIndirecto = expenses.filter(e => e.expense_type === 'gasto_variable_indirecto').reduce((s, e) => s + e.total_amount, 0)
  const totalGastoFijo = expenses.filter(e => e.expense_type === 'gasto_fijo').reduce((s, e) => s + e.total_amount, 0)
  const totalIvaCredito = expenses.filter(e => e.document_type === 'factura').reduce((s, e) => s + e.iva_amount, 0)

  const filteredExpenses = activeTab === 'todos' ? expenses : expenses.filter(e => e.expense_type === activeTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Costos y Gastos</h1>
          <p className="text-sm text-zinc-500 mt-1">{expenses.length} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} className="border-zinc-200 text-zinc-600">
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar costo o gasto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">

                {/* Selector tipo con distinción visual */}
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.entries(TIPO_LABELS) as [keyof typeof TIPO_LABELS, typeof TIPO_LABELS[keyof typeof TIPO_LABELS]][]).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, expense_type: key, expense_subcategory: '' }))}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                          form.expense_type === key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${val.color}`}>
                          {val.label}
                        </span>
                        <span className="text-xs text-zinc-400">{val.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategoría */}
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={form.expense_subcategory} onValueChange={v => setForm(f => ({ ...f, expense_subcategory: v }))}>
                    <SelectTrigger className="border-zinc-200">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategorias.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isOtro && (
                    <Input
                      placeholder="Describe la categoría..."
                      value={form.custom_subcategory}
                      onChange={e => setForm(f => ({ ...f, custom_subcategory: e.target.value }))}
                      className="border-zinc-200 mt-2"
                    />
                  )}
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Input
                    placeholder="Ej: Harina para pan"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="border-zinc-200"
                  />
                </div>

                {/* Documento */}
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <Select value={form.document_type} onValueChange={v => setForm(f => ({ ...f, document_type: v as 'factura' | 'boleta/otro' }))}>
                    <SelectTrigger className="border-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura">Factura (IVA recuperable)</SelectItem>
                      <SelectItem value="boleta/otro">Boleta / Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repetir mensual solo para gastos fijos */}
                {form.expense_type === 'gasto_fijo' && (
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
                      <p className="text-xs text-zinc-400">Se copiará automáticamente</p>
                    </div>
                  </div>
                )}

                {/* Monto */}
                <div className="space-y-2">
                  <Label>Monto total ($) *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.total_amount}
                    onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
                    className="border-zinc-200 tabular-nums"
                  />
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
                  {saving ? 'Guardando...' : 'Registrar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen con distinción visual */}
      <div className="space-y-3">
        {/* Costos */}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-3">Costos de Producción</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-zinc-400">Costo Variable Directo</p>
              <p className="text-xl font-semibold tabular-nums text-orange-500 mt-0.5">{fmt(totalCostoDirecto)}</p>
              <p className="text-xs text-zinc-400">ingredientes, insumos, packaging</p>
            </div>
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Gastos del Negocio</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-zinc-400">Gasto Variable Indirecto</p>
              <p className="text-xl font-semibold tabular-nums text-zinc-700 mt-0.5">{fmt(totalGastoIndirecto)}</p>
              <p className="text-xs text-zinc-400">publicidad, delivery</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Gasto Fijo</p>
              <p className="text-xl font-semibold tabular-nums text-rose-500 mt-0.5">{fmt(totalGastoFijo)}</p>
              <p className="text-xs text-zinc-400">arriendo, sueldos</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">IVA crédito fiscal</p>
              <p className="text-xl font-semibold tabular-nums text-emerald-600 mt-0.5">{fmt(totalIvaCredito)}</p>
              <p className="text-xs text-zinc-400">rebaja tu F29</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs filtro */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'costo_variable_directo', label: 'Costo Variable Directo' },
          { key: 'gasto_variable_indirecto', label: 'Gasto Variable Indirecto' },
          { key: 'gasto_fijo', label: 'Gasto Fijo' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingDown className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No hay registros en esta categoría.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredExpenses.map(e => {
              const tipoInfo = TIPO_LABELS[e.expense_type] ?? TIPO_LABELS.gasto_fijo
              return (
                <div key={e.id} className="px-4 py-3.5 hover:bg-zinc-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Receipt className="h-4 w-4 text-zinc-300 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">{e.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                        {e.expense_subcategory && (
                          <span className="text-xs text-zinc-400">{e.expense_subcategory}</span>
                        )}
                        {e.is_recurring && (
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-400">↻ mensual</Badge>
                        )}
                        <span className="text-xs text-zinc-400">
                          {format(new Date(e.created_at), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
