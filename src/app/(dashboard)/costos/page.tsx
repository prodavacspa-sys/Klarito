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
import { Plus, Pencil, Trash2, Download, ChefHat, ArrowRight, Info } from 'lucide-react'

type Product = { id: string; name: string }

type RecipeItem = {
  id?: string
  name: string
  quantity: string
  unit: string
  unit_cost: string
}

type Recipe = {
  id: string
  name: string
  description: string | null
  product_id: string | null
  monthly_units: number
  product?: { name: string }
}

type RecipeSummary = {
  recipe_id: string
  recipe_name: string
  product_id: string | null
  monthly_units: number
  variable_cost: number
  total_fixed_costs: number
  total_monthly_units: number
  total_unit_cost: number
}

const UNITS = ['unidad', 'kg', 'g', 'lt', 'ml', 'taza', 'cucharada', 'hora', 'metro']

const emptyItem = (): RecipeItem => ({ name: '', quantity: '', unit: 'unidad', unit_cost: '' })

export default function CostosPage() {
  const supabase = createClient()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [summaries, setSummaries] = useState<RecipeSummary[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [items, setItems] = useState<RecipeItem[]>([emptyItem()])
  const [form, setForm] = useState({ name: '', description: '', product_id: '', monthly_units: '100' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: r }, { data: s }, { data: p }] = await Promise.all([
      supabase.from('recipes').select('*, product:products(name)').eq('is_active', true).order('name'),
      supabase.from('recipe_cost_summary').select('*'),
      supabase.from('products').select('id, name').eq('is_active', true).order('name'),
    ])
    setRecipes(r ?? [])
    setSummaries(s ?? [])
    setProducts(p ?? [])
    setLoading(false)
  }

  function getSummary(id: string) {
    return summaries.find(s => s.recipe_id === id)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '', product_id: '', monthly_units: '100' })
    setItems([emptyItem()])
    setOpen(true)
  }

  async function openEdit(r: Recipe) {
    setEditing(r)
    setForm({
      name: r.name,
      description: r.description ?? '',
      product_id: r.product_id ?? '',
      monthly_units: String(r.monthly_units),
    })
    const { data } = await supabase.from('recipe_items').select('*').eq('recipe_id', r.id)
    setItems((data as any[])?.map(i => ({ id: i.id, name: i.name, quantity: String(i.quantity), unit: i.unit, unit_cost: String(i.unit_cost) })) ?? [emptyItem()])
    setOpen(true)
  }

  function updateItem(idx: number, key: keyof RecipeItem, value: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [key]: value } : item))
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  const totalVariable = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_cost) || 0), 0)

  async function handleSave() {
    if (!form.name) { toast.error('El nombre es obligatorio'); return }
    if (items.every(i => !i.name)) { toast.error('Agrega al menos un insumo'); return }
    setSaving(true)

    const payload = {
      name: form.name,
      description: form.description || null,
      product_id: form.product_id || null,
      monthly_units: parseInt(form.monthly_units) || 100,
    }

    let recipeId = editing?.id

    if (editing) {
      const { error } = await supabase.from('recipes').update(payload).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar'); setSaving(false); return }
      await supabase.from('recipe_items').delete().eq('recipe_id', editing.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('recipes').insert({ ...payload, user_id: user!.id }).select().single()
      if (error) { toast.error('Error al crear receta'); setSaving(false); return }
      recipeId = data.id
    }

    const validItems = items.filter(i => i.name && i.quantity && i.unit_cost)
    if (validItems.length > 0) {
      await supabase.from('recipe_items').insert(
        validItems.map(i => ({
          recipe_id: recipeId,
          name: i.name,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          unit_cost: parseFloat(i.unit_cost),
        }))
      )
    }

    if (form.product_id) {
      const summary = getSummary(recipeId!)
      const newCost = summary?.total_unit_cost ?? totalVariable
      await supabase.from('products').update({ cost_price: newCost }).eq('id', form.product_id)
    }

    toast.success(editing ? 'Receta actualizada' : 'Receta creada')
    setOpen(false)
    setSaving(false)
    fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta receta?')) return
    await supabase.from('recipes').update({ is_active: false }).eq('id', id)
    toast.success('Receta eliminada')
    fetchAll()
  }

  async function applyToProduct(recipeId: string, productId: string, cost: number) {
    await supabase.from('products').update({ cost_price: Math.round(cost) }).eq('id', productId)
    toast.success('Costo aplicado al producto')
  }

  function exportCSV() {
    const headers = ['Receta', 'Producto', 'Unidades/mes', 'Costo Variable', 'Costo Fijo Prorrateado', 'Costo Total Unitario']
    const rows = recipes.map(r => {
      const s = getSummary(r.id)
      const fixedShare = s ? s.total_fixed_costs / s.total_monthly_units : 0
      return [r.name, r.product?.name ?? '-', r.monthly_units, s?.variable_cost ?? 0, fixedShare.toFixed(0), s?.total_unit_cost?.toFixed(0) ?? 0]
    })
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'costos.csv'
    a.click()
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Costos</h1>
          <p className="text-sm text-zinc-500 mt-1">Recetas y estructura de costos de tus productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-zinc-200 text-zinc-600">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white" onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva receta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar receta' : 'Nueva receta de costos'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nombre de la receta *</Label>
                    <Input placeholder="Ej: Empanada de pino" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border-zinc-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Producto asociado</Label>
                    <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                      <SelectTrigger className="border-zinc-200">
                        <SelectValue placeholder="Selecciona producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Input placeholder="Ej: Receta para 1 unidad" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="border-zinc-200" />
                </div>

                <div className="space-y-2">
                  <Label>¿Cuántas unidades produces al mes?</Label>
                  <Input type="number" value={form.monthly_units} onChange={e => setForm(f => ({ ...f, monthly_units: e.target.value }))} className="border-zinc-200 tabular-nums w-40" />
                  <p className="text-xs text-zinc-400">Se usa para prorratear los costos fijos del negocio entre cada unidad</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Insumos y costos variables</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-zinc-200 text-zinc-600 h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Agregar insumo
                    </Button>
                  </div>

                  <div className="bg-zinc-50 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs text-zinc-400 font-medium px-1">
                      <span className="col-span-4">Insumo</span>
                      <span className="col-span-2">Cantidad</span>
                      <span className="col-span-2">Unidad</span>
                      <span className="col-span-3">Costo unit.</span>
                      <span className="col-span-1"></span>
                    </div>
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <Input className="col-span-4 border-zinc-200 h-8 text-sm" placeholder="Harina" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} />
                        <Input className="col-span-2 border-zinc-200 h-8 text-sm tabular-nums" type="number" placeholder="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        <Select value={item.unit} onValueChange={v => updateItem(idx, 'unit', v)}>
                          <SelectTrigger className="col-span-2 border-zinc-200 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input className="col-span-3 border-zinc-200 h-8 text-sm tabular-nums" type="number" placeholder="0" value={item.unit_cost} onChange={e => updateItem(idx, 'unit_cost', e.target.value)} />
                        <button onClick={() => removeItem(idx)} className="col-span-1 text-zinc-300 hover:text-rose-400 flex justify-center">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Resumen de costos</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Costo variable (insumos)</span>
                    <span className="tabular-nums font-medium text-zinc-900">{fmt(totalVariable)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Costo fijo prorrateado</span>
                    <span className="tabular-nums text-zinc-400 text-xs italic">Se calcula al guardar con tus gastos fijos del mes</span>
                  </div>
                  <div className="border-t border-zinc-200 pt-2 flex justify-between text-sm font-medium">
                    <span className="text-zinc-900">Costo total estimado</span>
                    <span className="tabular-nums text-zinc-900">{fmt(totalVariable)} + fijos</span>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear receta'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <p className="font-medium">¿Cómo funciona el cálculo?</p>
          <p className="mt-0.5">Los costos fijos de tu negocio (arriendo, sueldos, servicios) que registras en <strong>Gastos</strong> se dividen automáticamente entre todas las unidades que produces. Así sabes el costo real de cada producto.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-zinc-400 text-sm">Cargando recetas...</div>
      ) : recipes.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
          <ChefHat className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No hay recetas aún.</p>
          <p className="text-zinc-400 text-sm mt-1">Crea tu primera receta para calcular el costo real de tus productos.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {recipes.map(r => {
            const s = getSummary(r.id)
            const fixedShare = s && s.total_monthly_units > 0 ? s.total_fixed_costs / s.total_monthly_units : 0
            const totalCost = s?.total_unit_cost ?? 0
            return (
              <div key={r.id} className="bg-white border border-zinc-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-zinc-900">{r.name}</h3>
                      {r.product && <Badge variant="outline" className="text-xs border-zinc-200 text-zinc-500">{r.product.name}</Badge>}
                    </div>
                    {r.description && <p className="text-xs text-zinc-400 mt-0.5">{r.description}</p>}
                    <p className="text-xs text-zinc-400 mt-1">{r.monthly_units} unidades/mes</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-500" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-xs text-zinc-400">Costo variable</p>
                    <p className="text-lg font-semibold tabular-nums text-zinc-900 mt-0.5">{fmt(s?.variable_cost ?? 0)}</p>
                    <p className="text-xs text-zinc-400">insumos directos</p>
                  </div>
                  <div className="bg-zinc-50 rounded-lg p-3">
                    <p className="text-xs text-zinc-400">Costo fijo prorrateado</p>
                    <p className="text-lg font-semibold tabular-nums text-zinc-900 mt-0.5">{fmt(fixedShare)}</p>
                    <p className="text-xs text-zinc-400">del total de gastos fijos</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-xs text-emerald-600">Costo total unitario</p>
                    <p className="text-lg font-semibold tabular-nums text-emerald-700 mt-0.5">{fmt(totalCost)}</p>
                    <p className="text-xs text-emerald-500">costo real por unidad</p>
                  </div>
                </div>

                {r.product_id && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" className="border-zinc-200 text-zinc-600 text-xs h-7" onClick={() => applyToProduct(r.id, r.product_id!, totalCost)}>
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Aplicar costo al producto
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
