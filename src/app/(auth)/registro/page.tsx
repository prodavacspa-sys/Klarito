'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function RegistroPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    comuna: '',
    password: '',
    businessName: '',
    referralCode: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setForm(f => ({ ...f, referralCode: ref }))
      localStorage.setItem('klarito_ref', ref)
    }
  }, [])

  function handleField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.phone) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { business_name: form.businessName },
        emailRedirectTo: `${location.origin}/auth/confirm`,
      },
    })

    if (error) { toast.error(error.message); setLoading(false); return }
    if (!data.user) { toast.error('Error al crear cuenta'); setLoading(false); return }

    await supabase.from('profiles').update({
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
      address: form.address,
      comuna: form.comuna,
      business_name: form.businessName,
      referred_by: form.referralCode || null,
    }).eq('user_id', data.user.id)

    setStep('sent')
    setLoading(false)
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Revisa tu correo</h2>
            <p className="text-sm text-zinc-500 mt-2">
              Te enviamos un enlace de confirmación a <strong>{form.email}</strong>. Haz clic en él para activar tu cuenta.
            </p>
          </div>
          <p className="text-xs text-zinc-400">
            ¿No lo ves? Revisa tu carpeta de spam.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Klarito</h1>
          <p className="text-sm text-zinc-500 mt-1">Tus finanzas, en orden.</p>
        </div>
        <Card className="border-zinc-200 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Crear cuenta</CardTitle>
            <CardDescription>7 días gratis, luego $5.170/mes con IVA incluido.</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegistro}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input placeholder="Juan" value={form.firstName} onChange={e => handleField('firstName', e.target.value)} required className="border-zinc-200" />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos *</Label>
                  <Input placeholder="Pérez" value={form.lastName} onChange={e => handleField('lastName', e.target.value)} required className="border-zinc-200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nombre del negocio</Label>
                <Input placeholder="Ej: Panadería El Sol" value={form.businessName} onChange={e => handleField('businessName', e.target.value)} className="border-zinc-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Celular *</Label>
                  <Input placeholder="+56 9 1234 5678" value={form.phone} onChange={e => handleField('phone', e.target.value)} required className="border-zinc-200" />
                </div>
                <div className="space-y-2">
                  <Label>Comuna</Label>
                  <Input placeholder="Santiago" value={form.comuna} onChange={e => handleField('comuna', e.target.value)} className="border-zinc-200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input placeholder="Av. Principal 123" value={form.address} onChange={e => handleField('address', e.target.value)} className="border-zinc-200" />
              </div>
              <div className="space-y-2">
                <Label>Correo electrónico *</Label>
                <Input type="email" placeholder="tu@negocio.cl" value={form.email} onChange={e => handleField('email', e.target.value)} required className="border-zinc-200" />
              </div>
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => handleField('password', e.target.value)} required minLength={8} className="border-zinc-200" />
              </div>
              {form.referralCode && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-emerald-700">Código de referido aplicado: <strong>{form.referralCode}</strong></p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear cuenta
              </Button>
              <p className="text-sm text-zinc-500 text-center">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-zinc-900 font-medium hover:underline">Inicia sesión</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
