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
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
