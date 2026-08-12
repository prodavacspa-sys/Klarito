'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, ArrowLeft, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'

type Product = { id: string; name: string; sale_price: number; stock: number; product_type: string | null }
type CartItem = Product & { quantity: number }

const IVA_RATE = 0.19

export default function NuevaVentaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [payMethod, setPayMethod] = useState<'efectivo' | 'debito' | 'credito' | 'transferencia'>('efectivo')
  const [saving, setSaving] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('')
  const [commissionDebit, setCommissionDebit] = useState<number>(0)
  const [commissionCredit, setCommissionCredit] = useState<number>(0)
  const [hasDelivery, setHasDelivery] = useState(false)
  const [deliveryAmount, setDeliveryAmount] = useState('')

  async function fetchSubscription() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles')
      .select('subscription_status, commission_debit, commission_credit')
      .eq('user_id', user.id).single()
    if (profile) {
      setSubscriptionStatus(profile.subscription_status)
      setCommissionDebit(profile.commission_debit ?? 0)
      setCommissionCredit(profile.commission_credit ?? 0)
    }
  }

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('id, name, sale_price, stock, product_type')
      .eq('is_active', true)
      .not('product_type', 'eq', 'ingredient')
      .order('name')
    setProducts(data ?? [])
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount estándar de la app
  useEffect(() => { fetchProducts(); fetchSubscription() }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function addToCart(p: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id)
      if (existing) {
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...p, quantity: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    )
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const deliveryCost = hasDelivery ? (parseFloat(deliveryAmount) || 0) : 0
  const commissionRate = payMethod === 'debito' ? commissionDebit : payMethod === 'credito' ? commissionCredit : 0
  const cartNeto = cart.reduce((sum, i) => sum + i.sale_price * i.quantity, 0)
  const commissionNeto = Math.round(cartNeto * commissionRate / 100)
  const baseNeta = cartNeto + commissionNeto + deliveryCost
  const ivaAmount = Math.round(baseNeta * IVA_RATE)
  const subtotal = baseNeta + ivaAmount
  const netAmount = baseNeta

  async function handleConfirm() {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return }

    const sinStock = cart.find(i => i.product_type !== 'service' && i.quantity > i.stock)
    if (sinStock) { toast.error(`Stock insuficiente: ${sinStock.name} (disponible: ${sinStock.stock})`); return }

    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (subscriptionStatus !== 'active') {
      const { count } = await supabase.from('sales').select('*', { count: 'exact', head: true }).eq('user_id', user!.id)
      if ((count ?? 0) >= 3) {
        router.push('/suscripcion/activar')
        setSaving(false)
        return
      }
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: user!.id,
        net_amount: netAmount,
        iva_amount: ivaAmount,
        total_amount: subtotal,
        notes: `Pago: ${payMethod}`,
        payment_type: payMethod,
        commission_rate: commissionRate,
        commission_amount: commissionNeto,
      })
      .select()
      .single()

    if (saleError) { toast.error('Error al registrar venta'); setSaving(false); return }

    const { error: itemsError } = await supabase.from('sale_items').insert(
      cart.map(i => ({
        sale_id: sale.id,
        product_id: i.id,
        quantity: i.quantity,
        unit_price: Math.round(i.sale_price * 1.19),
        subtotal: Math.round(i.sale_price * 1.19) * i.quantity,
      }))
    )

    if (itemsError) {
      await supabase.from('sales').delete().eq('id', sale.id)
      toast.error(itemsError.message.includes('Stock insuficiente') ? itemsError.message : 'Error al guardar items')
      setSaving(false)
      return
    }

    if (commissionRate > 0 && commissionNeto > 0) {
      const commissionIva = Math.round(commissionNeto * 0.19)
      await supabase.from('expenses').insert({
        user_id: user!.id,
        description: `Comisión ${payMethod} — venta ${sale.id.slice(0, 8)}`,
        expense_type: 'gasto_variable_indirecto',
        expense_category: 'variable',
        expense_subcategory: payMethod === 'debito' ? 'Comisión débito' : 'Comisión crédito',
        document_type: 'factura',
        net_amount: commissionNeto,
        iva_amount: commissionIva,
        total_amount: commissionNeto + commissionIva,
        is_recurring: false,
      })
    }

    if (hasDelivery && deliveryCost > 0) {
      const deliveryIva = Math.round(deliveryCost * 0.19)
      await supabase.from('expenses').insert({
        user_id: user!.id,
        description: `Delivery — venta ${sale.id.slice(0, 8)}`,
        expense_type: 'gasto_variable_indirecto',
        expense_category: 'variable',
        expense_subcategory: 'Transporte / Delivery',
        document_type: 'boleta/otro',
        net_amount: deliveryCost,
        iva_amount: deliveryIva,
        total_amount: deliveryCost + deliveryIva,
        is_recurring: false,
      })
    }

    toast.success(`Venta registrada — ${fmt(subtotal)}`)
    setHasDelivery(false)
    setDeliveryAmount('')
    router.push('/ventas')
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/ventas">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Nueva venta</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Busca productos y agrégalos al carrito</p>
        </div>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 border-zinc-200"
              autoFocus
            />
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                {search ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filtered.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {p.product_type === 'service' ? 'Servicio' : `Stock: ${p.stock} unidades`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums text-emerald-600">{fmt(Math.round(p.sale_price * 1.19))}</span>
                      <span className="text-xs text-zinc-400 tabular-nums">Neto: {fmt(p.sale_price)}</span>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-zinc-200" onClick={() => addToCart(p)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden md:sticky md:top-6">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-900">Carrito</span>
              {cart.length > 0 && (
                <Badge variant="outline" className="text-xs border-zinc-200 text-zinc-500 ml-auto">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </Badge>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">
                Agrega productos desde la lista
              </div>
            ) : (
              <>
                <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-zinc-900 leading-tight">{item.name}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-rose-400 flex-shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 rounded border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm tabular-nums w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 rounded border border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm tabular-nums font-medium text-zinc-900">{fmt(item.sale_price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-zinc-100 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Neto</span>
                    <span className="tabular-nums">{fmt(netAmount)}</span>
                  </div>
                  {commissionRate > 0 && commissionNeto > 0 && (
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Comisión {payMethod} ({commissionRate}%)</span>
                      <span className="tabular-nums">+{fmt(commissionNeto)}</span>
                    </div>
                  )}
                  {hasDelivery && deliveryCost > 0 && (
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Delivery</span>
                      <span className="tabular-nums">+{fmt(deliveryCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>IVA (19%)</span>
                    <span className="tabular-nums">{fmt(ivaAmount)}</span>
                  </div>
                  <Separator className="bg-zinc-100" />
                  <div className="flex justify-between text-sm font-semibold text-zinc-900">
                    <span>Total</span>
                    <span className="tabular-nums">{fmt(subtotal)}</span>
                  </div>
                </div>

                <div className="px-4 pb-3 space-y-2">
                  <p className="text-xs text-zinc-400 font-medium">Medio de pago</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'efectivo', label: 'Efectivo', icon: Banknote },
                      { key: 'debito', label: 'Débito', icon: CreditCard },
                      { key: 'credito', label: 'Crédito', icon: CreditCard },
                      { key: 'transferencia', label: 'Transferencia', icon: ArrowLeftRight },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setPayMethod(key as typeof payMethod)}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm transition-colors ${
                          payMethod === key ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {(payMethod === 'debito' || payMethod === 'credito') && commissionRate === 0 && (
                    <p className="text-xs text-amber-500">
                      No tienes comisión de {payMethod} configurada.{' '}
                      <a href="/perfil" className="underline">Configúrala en Perfil</a>
                    </p>
                  )}

                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      id="has_delivery"
                      checked={hasDelivery}
                      onChange={e => { setHasDelivery(e.target.checked); if (!e.target.checked) setDeliveryAmount('') }}
                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 cursor-pointer"
                    />
                    <label htmlFor="has_delivery" className="text-sm text-zinc-700 cursor-pointer">¿Incluye delivery?</label>
                  </div>
                  {hasDelivery && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-zinc-500">Costo delivery (neto, sin IVA)</p>
                      <Input
                        type="number"
                        placeholder="0"
                        value={deliveryAmount}
                        onChange={e => setDeliveryAmount(e.target.value)}
                        className="border-zinc-200 tabular-nums h-8 text-sm"
                      />
                    </div>
                  )}

                  <Button
                    className="w-full bg-zinc-900 hover:bg-zinc-700 text-white mt-1"
                    onClick={handleConfirm}
                    disabled={saving}
                  >
                    {saving ? 'Registrando...' : `Confirmar venta • ${fmt(subtotal)}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
