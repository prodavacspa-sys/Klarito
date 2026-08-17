import { NextResponse } from 'next/server'
import { sendNewSignupNotification } from '@/lib/email'

// Sin sesión: se llama justo después de signUp(), antes de confirmar el email (todavía no hay
// auth.uid()). Por eso recibe los datos directo del formulario en vez de leerlos de profiles
// (con anon key y RLS, esa lectura devolvería vacío). Ver proxy.ts: esta ruta está excluida
// del middleware de auth para que la request no se redirija a /login.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  try {
    await sendNewSignupNotification({
      businessName: String(body.businessName ?? ''),
      firstName: String(body.firstName ?? ''),
      lastName: String(body.lastName ?? ''),
      email: String(body.email ?? ''),
      phone: String(body.phone ?? ''),
      empresaType: String(body.empresaType ?? ''),
      referralCode: body.referralCode ? String(body.referralCode) : null,
    })
  } catch {
    // No bloquear el registro del usuario si falla el correo de aviso.
  }

  return NextResponse.json({ ok: true })
}
