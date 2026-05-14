import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Klarito <onboarding@resend.dev>'

export async function sendWelcomeEmail(email: string, businessName: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: '¡Bienvenido a Klarito! 🎉',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; color: #18181b;">¡Hola, ${businessName}!</h1>
        <p style="color: #52525b;">Tu cuenta en Klarito está activa. Tienes <strong>7 días de prueba gratis</strong> para conocer la plataforma.</p>
        <p style="color: #52525b;">Con Klarito puedes:</p>
        <ul style="color: #52525b;">
          <li>Controlar tu inventario y calcular precios de venta</li>
          <li>Registrar ventas y gastos categorizados</li>
          <li>Ver tu punto de equilibrio en tiempo real</li>
          <li>Estimar tu IVA mensual (F29)</li>
        </ul>
        <a href="https://www.klarito.cl/dashboard" style="display:inline-block; background:#18181b; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
          Ir a mi dashboard
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">Si tienes dudas responde este correo — estaremos felices de ayudarte.</p>
      </div>
    `,
  })
}

export async function sendTrialEndingEmail(email: string, businessName: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Tu período de prueba termina mañana — Klarito',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 20px; color: #18181b;">Hola, ${businessName} 👋</h1>
        <p style="color: #52525b;">Tu período de prueba gratuito de Klarito termina mañana.</p>
        <p style="color: #52525b;">Para seguir usando Klarito sin interrupciones, activa tu suscripción hoy.</p>
        <a href="https://www.klarito.cl/suscripcion/activar"
           style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Activar suscripción — $5.950/mes
        </a>
        <p style="color: #71717a; font-size: 13px;">Si no activas tu cuenta, perderás acceso a tus datos en 30 días.</p>
      </div>
    `
  })
}

export async function sendPaymentSuccessEmail(email: string, businessName: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Pago recibido — Klarito',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; color: #18181b;">Pago confirmado</h1>
        <p style="color: #52525b;">Hola ${businessName}, recibimos tu pago mensual de <strong>$5.950</strong>. Tu suscripción a Klarito está activa por un mes más.</p>
        <a href="https://www.klarito.cl/dashboard" style="display:inline-block; background:#18181b; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
          Ir a mi dashboard
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">Klarito — Finanzas simples para tu negocio.</p>
      </div>
    `,
  })
}

export async function sendContactEmail(name: string, email: string, message: string) {
  await resend.emails.send({
    from: FROM,
    to: 'prodavac.spa@gmail.com',
    replyTo: email,
    subject: `Consulta de ${name} — Klarito`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; color: #18181b; margin-bottom: 4px;">Nueva consulta desde la landing</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 0;">Responde directamente a este correo para contestar al usuario.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
        <p style="color: #52525b; margin: 0 0 4px;"><strong>Nombre:</strong> ${name}</p>
        <p style="color: #52525b; margin: 0 0 4px;"><strong>Email:</strong> ${email}</p>
        <p style="color: #52525b; margin: 16px 0 4px;"><strong>Mensaje:</strong></p>
        <p style="color: #52525b; background: #f4f4f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
      </div>
    `,
  })
}

export async function sendPaymentFailedEmail(email: string, businessName: string) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Problema con tu pago — Klarito',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; color: #18181b;">Hubo un problema con tu pago</h1>
        <p style="color: #52525b;">Hola ${businessName}, no pudimos procesar tu pago mensual de $5.950. Tu acceso a Klarito puede verse afectado.</p>
        <p style="color: #52525b;">Por favor actualiza tu medio de pago para continuar usando Klarito:</p>
        <a href="https://www.klarito.cl/perfil" style="display:inline-block; background:#e11d48; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:8px;">
          Actualizar medio de pago
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">Flow reintentará el cobro automáticamente. Si el problema persiste contáctanos.</p>
      </div>
    `,
  })
}
