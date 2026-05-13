'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

type EmpresaType = 'natural' | 'formal'

export function RegistroModal({ fullWidth, variant }: { fullWidth?: boolean; variant?: 'referral' }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'tipo' | 'form'>('tipo')
  const [empresaType, setEmpresaType] = useState<EmpresaType>('natural')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Campos comunes
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [comuna, setComuna] = useState('')
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Campos empresa formal
  const [rut, setRut] = useState('')
  const [giro, setGiro] = useState('')
  const [rutAddress, setRutAddress] = useState('')

  // Leer ref de URL
  const refCode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref') ?? ''
    : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const metadata: Record<string, string> = {
      first_name: firstName,
      last_name: lastName,
      business_name: businessName,
      phone,
      comuna,
      address,
      referred_by: refCode,
    }

    if (empresaType === 'formal') {
      metadata.rut_empresa = rut
      metadata.giro = giro
      metadata.rut_address = rutAddress
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: metadata,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  function openModal() {
    setOpen(true)
    setDone(false)
    setError('')
    setStep('tipo')
    setFirstName(''); setLastName(''); setBusinessName('')
    setPhone(''); setComuna(''); setAddress('')
    setEmail(''); setPassword('')
    setRut(''); setGiro(''); setRutAddress('')
  }

  return (
    <>
      <button
        onClick={openModal}
        className={`inline-flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-lg transition-colors text-base cursor-pointer${fullWidth ? ' w-full' : ''}${variant === 'referral' ? ' bg-emerald-950 text-white hover:bg-emerald-900' : ' bg-zinc-900 text-white hover:bg-zinc-700'}`}
      >
        Empieza gratis por 7 días
        <ArrowRight className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-lg p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {done ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Revisa tu correo</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Te enviamos un enlace de confirmación a <strong>{email}</strong>. Al confirmarlo, podrás activar tu cuenta.
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="text-sm text-zinc-400 hover:text-zinc-600">Cerrar</button>
              </div>

            ) : step === 'tipo' ? (
              <>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-zinc-900">Crear cuenta</h2>
                  <p className="text-sm text-zinc-500">7 días gratis, luego $5.170/mes con IVA incluido.</p>
                </div>
                <p className="text-sm font-medium text-zinc-700">¿Cómo describes tu negocio?</p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => { setEmpresaType('natural'); setStep('form') }}
                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-zinc-200 hover:border-zinc-900 transition-colors text-left"
                  >
                    <span className="text-2xl">🛒</span>
                    <div>
                      <p className="font-medium text-zinc-900">Emprendedor/a informal</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Vendo sin boleta, feria, delivery, negocio personal.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setEmpresaType('formal'); setStep('form') }}
                    className="flex items-start gap-4 p-4 rounded-xl border-2 border-zinc-200 hover:border-zinc-900 transition-colors text-left"
                  >
                    <span className="text-2xl">🏢</span>
                    <div>
                      <p className="font-medium text-zinc-900">Empresa o negocio formal</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Emito boletas o facturas, tengo RUT de empresa.</p>
                    </div>
                  </button>
                </div>
                <p className="text-center text-sm text-zinc-500">
                  ¿Ya tienes cuenta?{' '}
                  <a href="/login" className="font-medium text-zinc-900 hover:underline">Inicia sesión</a>
                </p>
              </>

            ) : (
              <>
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep('tipo')} className="text-zinc-400 hover:text-zinc-600 text-sm">← Volver</button>
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">Crear cuenta</h2>
                    <p className="text-sm text-zinc-500">7 días gratis, luego $5.170/mes con IVA incluido.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700">Nombre *</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="Juan" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700">Apellidos *</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="Pérez" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Nombre del negocio</label>
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="Ej: Panadería El Sol" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700">Celular *</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="+56 9 1234 5678" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700">Comuna</label>
                      <input type="text" value={comuna} onChange={e => setComuna(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="Santiago" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Dirección</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="Av. Principal 123" />
                  </div>

                  {empresaType === 'formal' && (
                    <div className="space-y-3 pt-2 border-t border-zinc-100">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Datos de facturación</p>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700">RUT empresa *</label>
                        <input type="text" value={rut} onChange={e => setRut(e.target.value)} required={empresaType === 'formal'}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          placeholder="76.123.456-7" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700">Giro *</label>
                        <input type="text" value={giro} onChange={e => setGiro(e.target.value)} required={empresaType === 'formal'}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          placeholder="Comercio al por menor" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700">Dirección de facturación *</label>
                        <input type="text" value={rutAddress} onChange={e => setRutAddress(e.target.value)} required={empresaType === 'formal'}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                          placeholder="Av. Comercio 456, Santiago" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                    <label className="text-sm font-medium text-zinc-700">Correo electrónico *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="tu@negocio.cl" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Contraseña *</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      placeholder="Mínimo 8 caracteres" />
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-700 text-white">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear cuenta →'}
                  </Button>
                </form>

                <p className="text-center text-sm text-zinc-500">
                  ¿Ya tienes cuenta?{' '}
                  <a href="/login" className="font-medium text-zinc-900 hover:underline">Inicia sesión</a>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
