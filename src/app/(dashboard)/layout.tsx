import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/app/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        userEmail={user.email ?? ''}
        subscriptionStatus={profile?.subscription_status ?? 'inactive'}
      />
      <main className="flex-1 overflow-auto min-w-0">
        {profile?.subscription_status !== 'active' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-amber-800">
                <strong>Estás en modo prueba.</strong> Activa tu cuenta para continuar usando Klarito después de los 7 días gratis.
              </span>
            </div>
            <a href="/perfil" className="text-xs font-medium bg-amber-800 text-white px-3 py-1.5 rounded-lg hover:bg-amber-900 transition-colors">
              Activar ahora — $5.170/mes
            </a>
          </div>
        )}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
