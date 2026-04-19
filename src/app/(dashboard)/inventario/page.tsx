'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Download, AlertTriangle } from 'lucide-react'

type Product = {
  id: string
  name: string
  cost_price: number
  margin_percentage: number
  sale_price: number
  stock: number
  min_stock_alert: number
  is_active: boolean
}

const emptyForm = {
  name: '',
  cost_price: '',
  margin_percentage: '',
  sale_price: '',
  stock: '',
  min_stock_alert: '5',
}

export default function InventarioPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name')
    setProducts(data ?? [])
    setLoading(false)
  }

  function handleField(key: string, value: string) {
    const updated = { ...form, [key]: value }
    if (key === 'cost_price' || key === 'margin_percentage') {
      const cost = parseFloat(updated.cost_price) || 0
      const margin = parseFloat(updated.margin_percentage) || 0
      if (cost > 0 && margin > 0) {
        updated.sale_price = (cost * (1 + margin / 100)).toFixed(0)
      }
    } else if (key === 'sale_price') {
      const cost = parseFloat(updated.cost_price) || 0
      const price = parseFloat(value) || 0
      if (cost > 0 && price > 0) {
        updated.margin_percentage = (((price / cost) - 1) * 100).toFixed(1)
      }
    }
    setForm(updated)
  }

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      cost_price: String(p.cost_price),
      margin_percentage: String(p.margin_percentage),
      sale_price: String(p.sale_price),
      stock: String(p.stock),
      min_stock_alert: String(p.min_stock_alert),
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.cost_price || !form.sale_price) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name,
      cost_price: parseFloat(form.cost_price),
      margin_percentage: parseFloat(form.margin_percentage) || 0,
      sale_price: parseFloat(form.sale_price),
      stock: parseInt(form.stock) || 0,
      min_stock_alert: parseInt(form.min_stock_alert) || 5,
    }

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { toast.error('Error al actualizar'); setSaving(false); return }
      toast.success('Producto actualizado')
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('products').insert({ ...payload, user_id: user!.id })
      if (error) { toast.error('Error al crear producto'); setSaving(false); return }
      toast.success('Producto creado')
    }

    setOpen(false)
    setSaving(false)
    fetchProducts()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').update({ is_active: false }).eq('id', id)
    toast.success('Producto eliminado')
    fetchProducts()
  }

  function exportCSV() {
    const headers = ['Nombre', 'Costo', 'Margen %', 'Precio Venta', 'Stock', 'Stock Mínimo']
    const rows = products.map(p => [p.name, p.cost_price, p.margin_percentage, p.sale_price, p.stock, p.min_stock_alert])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventario.csv'
    a.click()
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

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
            Exportar CSV
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white" onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo producto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input placeholder="Ej: Empanada de pino" value={form.name} onChange={e => handleField('name', e.target.value)} className="border-zinc-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Costo ($) *</Label>
                    <Input type="number" placeholder="0" value={form.cost_price} onChange={e => handleField('cost_price', e.target.value)} className="border-zinc-200 tabular-nums" />
                  </div>
                  <div className="space-y-2">
                    <Label>Margen (%)</Label>
                    <Input type="number" placeholder="0" value={form.margin_percentage} onChange={e => handleField('margin_percentage', e.target.value)} className="border-zinc-200 tabular-nums" />
                    <p className="text-xs text-zinc-400">↑ define precio</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Precio de venta ($) *</Label>
                  <Input type="number" placeholder="0" value={form.sale_price} onChange={e => handleField('sale_price', e.target.value)} className="border-zinc-200 tabular-nums font-medium" />
                  <p className="text-xs text-zinc-400">Puedes escribir el precio y el margen se calculará solo, o escribir el margen y se calculará el precio.</p>
                </div>
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

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-400 text-sm">No hay productos aún.</p>
            <p className="text-zinc-400 text-sm mt-1">Crea tu primer producto con el botón de arriba.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-100">
                <TableHead className="text-zinc-500 font-medium">Producto</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Costo</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Margen</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Precio venta</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Stock</TableHead>
                <TableHead className="text-zinc-500 font-medium text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id} className="border-zinc-100 hover:bg-zinc-50">
                  <TableCell className="font-medium text-zinc-900">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-600">{fmt(p.cost_price)}</TableCell>
                  <TableCell className="text-right tabular-nums text-zinc-600">{p.margin_percentage}%</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-emerald-600">{fmt(p.sale_price)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`tabular-nums font-medium ${p.stock <= p.min_stock_alert ? 'text-rose-500' : 'text-zinc-900'}`}>
                      {p.stock}
                      {p.stock <= p.min_stock_alert && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
    </div>
  )
}
