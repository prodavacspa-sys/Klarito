import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Klarito <hola@klarito.cl>'

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
    subject: 'Tu prueba gratuita termina mañana — Klarito',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; color: #18181b;">Hola, ${businessName}</h1>
        <p style="color: #52525b;">Tu período de prueba gratuita en Klarito termina <strong>mañana</strong>. A partir de ese momento se cobrará <strong>$5.170/mes</strong> al medio de pago registrado.</p>
        <p style="color: #52525b;">Si no deseas continuar, puedes cancelar tu suscripción antes de que se realice el cobro:</p>
        <a href="https://www.klarito.cl/perfil" style="display:inline-block; background:#18181b; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:8px;">
          Administrar suscripción
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">Si decides continuar, no necesitas hacer nada. El cobro se realizará automáticamente.</p>
      </div>
    `,
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
        <p style="color: #52525b;">Hola ${businessName}, recibimos tu pago mensual de <strong>$5.170</strong>. Tu suscripción a Klarito está activa por un mes más.</p>
        <a href="https://www.klarito.cl/dashboard" style="display:inline-block; background:#18181b; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:16px;">
          Ir a mi dashboard
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">Klarito — Finanzas simples para tu negocio.</p>
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
        <p style="color: #52525b;">Hola ${businessName}, no pudimos procesar tu pago mensual de $5.170. Tu acceso a Klarito puede verse afectado.</p>
        <p style="color: #52525b;">Por favor actualiza tu medio de pago para continuar usando Klarito:</p>
        <a href="https://www.klarito.cl/perfil" style="display:inline-block; background:#e11d48; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; margin-top:8px;">
          Actualizar medio de pago
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 32px;">Flow reintentará el cobro automáticamente. Si el problema persiste contáctanos.</p>
      </div>
    `,
  })
}
