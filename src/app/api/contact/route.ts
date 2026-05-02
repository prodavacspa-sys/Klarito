import { NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { name, email, message } = await request.json()

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
  }

  await sendContactEmail(name.trim(), email.trim(), message.trim())
  return NextResponse.json({ ok: true })
}
