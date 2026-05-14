'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Download, AlertTriangle, FlaskConical, Factory } from 'lucide-react'

type ProductType = 'resale' | 'manufactured' | 'service' | 'ingredient'

type Product = {
  id: string
  name: string
  product_type: ProductType
  cost_price: number
  cost_per_unit: number
  unit: string
  margin_percentage: number
  sale_price: number
  stock: number
  min_stock_alert: number
  is_active: boolean
}

type RecipeIngredient = {
  id?: string
  ingredient_id: string
  ingredient_name?: string
  quantity: number
  unit: string
}

const PRODUCT_TYPES = {
  resale: { label: 'Compro y revendo', icon: '🛒', desc: 'Compras el producto y lo vendes' },
  manufactured: { label: 'Lo fabrico', icon: '🍳', desc: 'Lo produces con insumos' },
  service: { label: 'Servicio', icon: '💆', desc: 'Vendes tu tiempo o habilidad' },
  ingredient: { label: 'Insumo', icon: '📦', desc: 'Materia prima, no se vende directamente' },
}

const UNITS = ['unidad', 'kg', 'g', 'mg', 'litro', 'ml', 'cc', 'metro', 'cm', 'porción', 'otro']

const emptyForm = {
  name: '',
  product_type: 'resale' as ProductType,
  cost_price: '',
  cost_per_unit: '',
  unit: 'unidad',
  margin_percentage: '',
  sale_price: '',
  stock: '',
  min_stock_alert: '5',
}

export default function InventarioPage() {
  const supabase = createClient()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [productionOpen, setProductionOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [recipe, setRecipe] = useState<RecipeIngredient[]>([])
  const [saving, setSaving] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('inactive')
  const [activeTab, setActiveTab] = useState<'todos' | ProductType>('todos')
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('name')
  const [productionProduct, setProductionProduct] = useState<Product | null>(null)
  const [productionQty, setProductionQty] = useState('')
  const [productionRecipe, setProductionRecipe] = useState<(RecipeIngredient & { available_stock: number })[]>([])

  useEffect(() => { fetchAll() }, [sortBy])

  async function fetchAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('user_id', user.id).single()
      setSubscriptionStatus(profile?.subscription_status ?? 'inactive')
    }
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order(sortBy, { ascending: true })
    setProducts(data ?? [])
    setIngredients((data ?? []).filter(p => p.product_type === 'ingredient'))
    setLoading(false)
  }

  function handleField(key: string, value: string) {
    const updated = { ...form, [key]: value }
    if (key === 'cost_price' || key === 'margin_percentage') {
      const cost = parseFloat(updated.cost_price) || 0
      const margin = parseFloat(updated.margin_percentage) || 0
      if (cost > 0 && margin > 0) updated.sale_price = (cost * (1 + margin / 100)).toFixed(0)
    } else if (key === 'sale_price') {
      const cost = parseFloat(updated.cost_price) || 0
      const price = parseFloat(value) || 0
      if (cost > 0 && price > 0) updated.margin_percentage = (((price / cost) - 1) * 100).toFixed(1)
    }
    setForm(updated)
  }

  function addRecipeIngredient() {
    setRecipe(prev => [...prev, { ingredient_id: '', quantity: 0, unit: 'g' }])
  }

  function updateRecipeIngredient(idx: number, field: string, value: string | number) {
    setRecipe(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  function removeRecipeIngredient(idx: number) {
    setRecipe(prev => prev.filter((_, i) => i !== idx))
  }

  function openNew() {
    if (subscriptionStatus !== 'active' && products.length >= 3) { router.push('/suscripcion/activar'); return }
    if (subscriptionStatus === 'active' && products.length >= 200) { toast.error('Límite de 200 productos'); return }
    setEditing(null)
    setForm(emptyForm)
    setRecipe([])
    setOpen(true)
  }

  async function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      product_type: p.product_type ?? 'resale',
      cost_price: String(p.cost_price),
      cost_per_unit: String(p.cost_per_unit ?? 0),
      unit: p.unit ?? 'unidad',
      margin_percentage: String(p.margin_percentage),
      sale_price: String(p.sale_price),
      stock: String(p.stock),
      min_stock_alert: String(p.min_stock_alert),
    })
    if (p.product_type === 'manufactured' || p.product_type === 'service') {
      const { data } = await supabase
        .from('recipe_ingredients')
        .select('*, ingredient:ingredient_id(name)')
        .eq('product_id', p.id)
      setRecipe(data?.map(r => ({
        id: r.id,
        ingredient_id: r.ingredient_id,
        ingredient_name: r.ingredient?.name,
        quantity: r.quantity,
        unit: r.unit,
      })) ?? [])
    } else {
      setRecipe([])
    }
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name) { toast.error('Ingresa el nombre'); return }
    if (form.product_type !== 'ingredient' && !form.sale_price) { toast.error('Ingresa el precio de venta'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const payload: any = {
      name: form.name,
      product_type: form.product_type,
      unit: form.unit,
      margin_percentage: parseFloat(form.margin_percentage) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock_alert: parseInt(form.min_stock_alert) || 5,
    }

    if (form.product_type === 'ingredient') {
      payload.cost_price = parseFloat(form.cost_per_unit) || 0
      payload.cost_per_unit = parseFloat(form.cost_per_unit) || 0
    } else if (form.product_type === 'resale') {
      payload.cost_price = parseFloat(form.cost_price) || 0
      payload.cost_per_unit = parseFloat(form.cost_price) || 0
    } else {
      payload.cost_price = 0
      payload.cost_per_unit = 0
    }

    let productId = editing?.id

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar'); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('products').insert({ ...payload, user_id: user!.id }).select().single()
      if (error) { toast.error('Error al crear'); setSaving(false); return }
      productId = data.id
    }

    if ((form.product_type === 'manufactured' || form.product_type === 'service') && productId) {
      await supabase.from('recipe_ingredients').delete().eq('product_id', productId)
      if (recipe.length > 0) {
        const validRecipe = recipe.filter(r => r.ingredient_id && r.quantity > 0)
        if (validRecipe.length > 0) {
          await supabase.from('recipe_ingredients').insert(
            validRecipe.map(r => ({
              product_id: productId,
              ingredient_id: r.ingredient_id,
              quantity: r.quantity,
              unit: r.unit,
            }))
          )
          const recipeCost = validRecipe.reduce((sum, r) => {
            const ing = ingredients.find(i => i.id === r.ingredient_id)
            return sum + (ing?.cost_per_unit ?? 0) * r.quantity
          }, 0)
          await supabase.from('products').update({ cost_price: recipeCost, cost_per_unit: recipeCost }).eq('id', productId)
        }
      }
    }

    toast.success(editing ? 'Actualizado' : 'Creado')
    setOpen(false)
    setSaving(false)
    fetchAll()
  }

  async function openProduction(p: Product) {
    setProductionProduct(p)
    setProductionQty('')
    const { data } = await supabase
      .from('recipe_ingredients')
      .select('*, ingredient:ingredient_id(name, stock, cost_per_unit, unit)')
      .eq('product_id', p.id)
    setProductionRecipe(data?.map(r => ({
      ingredient_id: r.ingredient_id,
      ingredient_name: r.ingredient?.name,
      quantity: r.quantity,
      unit: r.unit,
      available_stock: r.ingredient?.stock ?? 0,
    })) ?? [])
    setProductionOpen(true)
  }

  async function handleProduction() {
    if (!productionProduct || !productionQty) return
    const qty = parseFloat(productionQty)
    if (qty <= 0) { toast.error('Ingresa una cantidad válida'); return }

    const insufficient = productionRecipe.filter(r => r.available_stock < r.quantity * qty)
    if (insufficient.length > 0) {
      toast.error(`Stock insuficiente: ${insufficient.map(r => r.ingredient_name).join(', ')}`)
      return
    }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    for (const r of productionRecipe) {
      const ing = ingredients.find(i => i.id === r.ingredient_id)
      if (ing) {
        await supabase.from('products')
          .update({ stock: ing.stock - r.quantity * qty })
          .eq('id', r.ingredient_id)
      }
    }

    await supabase.from('products')
      .update({ stock: productionProduct.stock + qty })
      .eq('id', productionProduct.id)

    await supabase.from('productions').insert({
      user_id: user!.id,
      product_id: productionProduct.id,
      quantity: qty,
      cost_total: productionProduct.cost_price * qty,
    })

    toast.success(`Producción registrada — ${qty} ${productionProduct.unit}`)
    setProductionOpen(false)
    setSaving(false)
    fetchAll()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').update({ is_active: false }).eq('id', id)
    toast.success('Eliminado')
    fetchAll()
  }

  function exportCSV() {
    const headers = ['Nombre', 'Tipo', 'Unidad', 'Costo', 'Precio Venta', 'Margen %', 'Stock']
    const rows = products.map(p => [p.name, p.product_type, p.unit, p.cost_price, p.sale_price, p.margin_percentage, p.stock])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'inventario.csv'; a.click()
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  const recipeCost = recipe.reduce((sum, r) => {
    const ing = ingredients.find(i => i.id === r.ingredient_id)
    return sum + (ing?.cost_per_unit ?? 0) * (r.quantity || 0)
  }, 0)

  const filtered = activeTab === 'todos' ? products : products.filter(p => p.product_type === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Inventario</h1>
          <p className="text-sm text-zinc-500 mt-1">{products.length} productos activos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-zinc-200 text-zinc-600">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white" onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar' : 'Nuevo producto'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">

                <div className="space-y-2">
                  <Label>¿Qué tipo de producto es? *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(PRODUCT_TYPES) as [ProductType, typeof PRODUCT_TYPES[ProductType]][]).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, product_type: key }))}
                        className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-colors ${
                          form.product_type === key ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <span className="text-lg">{val.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">{val.label}</p>
                          <p className="text-xs text-zinc-400">{val.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input placeholder="Ej: Pan amasado" value={form.name} onChange={e => handleField('name', e.target.value)} className="border-zinc-200" />
                </div>

                <div className="space-y-2">
                  <Label>Unidad de medida</Label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {form.product_type === 'ingredient' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Costo total pagado ($) *</Label>
                        <Input
                          type="number"
                          placeholder="ej: 5000"
                          value={form.cost_price}
                          onChange={e => {
                            const totalPaid = parseFloat(e.target.value) || 0
                            const qty = parseFloat(form.stock) || 1
                            setForm(f => ({
                              ...f,
                              cost_price: e.target.value,
                              cost_per_unit: qty > 0 ? (totalPaid / qty).toFixed(4) : '0'
                            }))
                          }}
                          className="border-zinc-200 tabular-nums"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad comprada ({form.unit}) *</Label>
                        <Input
                          type="number"
                          placeholder="ej: 500"
                          value={form.stock}
                          onChange={e => {
                            const qty = parseFloat(e.target.value) || 1
                            const totalPaid = parseFloat(form.cost_price) || 0
                            setForm(f => ({
                              ...f,
                              stock: e.target.value,
                              cost_per_unit: qty > 0 ? (totalPaid / qty).toFixed(4) : '0'
                            }))
                          }}
                          className="border-zinc-200 tabular-nums"
                        />
                      </div>
                    </div>
                    {form.cost_per_unit && parseFloat(form.cost_per_unit) > 0 && (
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">Costo por {form.unit}:</p>
                        <p className="text-sm font-semibold text-zinc-900">${parseFloat(form.cost_per_unit).toFixed(2)}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Este valor se usará para calcular el costo de tus recetas</p>
                      </div>
                    )}
                  </div>
                )}

                {form.product_type === 'resale' && (
                  <div className="space-y-2">
                    <Label>Costo de compra (neto, sin IVA) *</Label>
                    <Input type="number" placeholder="0" value={form.cost_price} onChange={e => handleField('cost_price', e.target.value)} className="border-zinc-200 tabular-nums" />
                  </div>
                )}

                {(form.product_type === 'manufactured' || form.product_type === 'service') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Insumos de la receta</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addRecipeIngredient} className="h-7 text-xs border-zinc-200">
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar insumo
                      </Button>
                    </div>
                    {recipe.length === 0 && (
                      <p className="text-xs text-zinc-400 text-center py-2">No hay insumos agregados</p>
                    )}
                    {recipe.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <select
                            value={r.ingredient_id}
                            onChange={e => updateRecipeIngredient(idx, 'ingredient_id', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          >
                            <option value="">Seleccionar</option>
                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            placeholder="Cantidad"
                            value={r.quantity || ''}
                            onChange={e => updateRecipeIngredient(idx, 'quantity', parseFloat(e.target.value))}
                            className="border-zinc-200 text-xs h-8"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={r.unit}
                            onChange={e => updateRecipeIngredient(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 text-xs focus:outline-none"
                          >
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <button onClick={() => removeRecipeIngredient(idx)} className="text-zinc-300 hover:text-rose-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {recipe.length > 0 && (
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">Costo estimado por unidad:</p>
                        <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                          {fmt(recipe.reduce((sum, r) => {
                            const ing = ingredients.find(i => i.id === r.ingredient_id)
                            return sum + (ing?.cost_per_unit ?? 0) * (r.quantity || 0)
                          }, 0))}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {form.product_type !== 'ingredient' && (
                  <>
                    {(form.product_type === 'manufactured' || form.product_type === 'service') && recipeCost > 0 && (
                      <div className="bg-zinc-50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500">Costo de producción por unidad:</p>
                        <p className="text-sm font-semibold text-zinc-900 mt-0.5">{fmt(recipeCost)}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Margen (%)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={form.margin_percentage}
                          onChange={e => {
                            const margin = parseFloat(e.target.value) || 0
                            const cost = (form.product_type === 'manufactured' || form.product_type === 'service')
                              ? recipeCost
                              : parseFloat(form.cost_price) || 0
                            const newPrice = cost > 0 && margin > 0 ? (cost * (1 + margin / 100)).toFixed(0) : form.sale_price
                            setForm(f => ({ ...f, margin_percentage: e.target.value, sale_price: newPrice }))
                          }}
                          className="border-zinc-200 tabular-nums"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio venta (neto) *</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={form.sale_price}
                          onChange={e => {
                            const price = parseFloat(e.target.value) || 0
                            const cost = (form.product_type === 'manufactured' || form.product_type === 'service')
                              ? recipeCost
                              : parseFloat(form.cost_price) || 0
                            const newMargin = cost > 0 && price > 0 ? (((price / cost) - 1) * 100).toFixed(1) : form.margin_percentage
                            setForm(f => ({ ...f, sale_price: e.target.value, margin_percentage: newMargin }))
                          }}
                          className="border-zinc-200 tabular-nums"
                        />
                        {form.sale_price && parseFloat(form.sale_price) > 0 && (
                          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span className="text-xs text-emerald-700">Precio con IVA (lo que paga el cliente):</span>
                            <span className="text-sm font-semibold text-emerald-700">
                              {fmt(Math.round(parseFloat(form.sale_price) * 1.19))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400">El precio es neto (sin IVA). El IVA se calcula al registrar la venta.</p>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Stock inicial</Label>
                    <Input type="number" placeholder="0" value={form.stock} onChange={e => handleField('stock', e.target.value)} className="border-zinc-200 tabular-nums" />
                  </div>
                  <div className="space-y-2">
                    <Label>Alerta mínimo</Label>
                    <Input type="number" placeholder="5" value={form.min_stock_alert} onChange={e => handleField('min_stock_alert', e.target.value)} className="border-zinc-200 tabular-nums" />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'resale', label: '🛒 Compro y revendo' },
          { key: 'manufactured', label: '🍳 Fabrico' },
          { key: 'service', label: '💆 Servicios' },
          { key: 'ingredient', label: '📦 Insumos' },
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

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 text-sm">No hay productos en esta categoría.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100">
                <TableHead className="text-zinc-500 font-medium">Producto</TableHead>
                <TableHead className="text-zinc-500 font-medium">Tipo</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Costo</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Precio venta</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Margen</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Stock</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="border-zinc-100 hover:bg-zinc-50">
                  <TableCell className="font-medium text-zinc-900">{p.name}</TableCell>
                  <TableCell>
                    <span className="text-sm">{PRODUCT_TYPES[p.product_type as ProductType]?.icon ?? '📦'}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-600">{fmt(p.cost_price)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-emerald-600">
                    {p.product_type === 'ingredient' ? '—' : fmt(p.sale_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-600">
                    {p.product_type === 'ingredient' ? '—' : `${p.margin_percentage}%`}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`tabular-nums font-medium ${p.stock <= p.min_stock_alert ? 'text-rose-500' : 'text-zinc-900'}`}>
                      {p.stock} {p.unit}
                      {p.stock <= p.min_stock_alert && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {p.product_type === 'manufactured' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-600" onClick={() => openProduction(p)} title="Registrar producción">
                          <Factory className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-rose-500" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={productionOpen} onOpenChange={setProductionOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar producción — {productionProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>¿Cuántas unidades vas a producir?</Label>
              <Input
                type="number"
                placeholder="0"
                value={productionQty}
                onChange={e => setProductionQty(e.target.value)}
                className="border-zinc-200 tabular-nums"
                autoFocus
              />
            </div>

            {productionQty && parseFloat(productionQty) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Insumos requeridos:</p>
                {productionRecipe.map((r, idx) => {
                  const needed = r.quantity * parseFloat(productionQty)
                  const ok = r.available_stock >= needed
                  return (
                    <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${ok ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{r.ingredient_name}</p>
                        <p className="text-xs text-zinc-500">Necesitas: {needed} {r.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${ok ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {ok ? '✓' : '✗'}
                        </p>
                        <p className="text-xs text-zinc-400">Stock: {r.available_stock} {r.unit}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <Button
              onClick={handleProduction}
              disabled={saving || !productionQty}
              className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
            >
              {saving ? 'Procesando...' : 'Confirmar producción'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
