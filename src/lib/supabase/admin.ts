import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Cliente con service_role: bypassa RLS por completo. Usar SOLO en rutas
// server-to-server sin sesión de usuario (ej. webhook de Flow), donde la
// autenticidad del caller ya se verificó por otro medio (firma HMAC).
// NUNCA importar este archivo desde código que corra en el navegador ni
// desde una ruta que exponga datos directamente a un usuario sin filtrar
// explícitamente por su user_id.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
