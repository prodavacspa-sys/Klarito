import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/app/sidebar'
import { TrialBanner } from '@/components/app/trial-banner'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, flow_subscription_id, created_at, trial_started_at')
    .eq('user_id', user.id)
    .single()

  const trialDaysLeft = profile?.trial_started_at
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.trial_started_at).getTime()) / (1000 * 60 * 60 * 24)))
    : profile?.flow_subscription_id
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 7

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        userEmail={user.email ?? ''}
        subscriptionStatus={profile?.subscription_status ?? 'inactive'}
      />
      <main className="flex-1 overflow-auto min-w-0 md:ml-0">
        <TrialBanner
          subscriptionStatus={profile?.subscription_status ?? 'inactive'}
          trialDaysLeft={trialDaysLeft}
        />
        <div className="p-4 md:p-8 pt-20 md:pt-4 pb-24 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
