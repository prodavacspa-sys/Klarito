'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Receipt, LogOut, ChefHat, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', Icon: Package },
  { href: '/ventas', label: 'Ventas', Icon: ShoppingCart },
  { href: '/gastos', label: 'Gastos', Icon: Receipt },
  { href: '/costos', label: 'Costos', Icon: ChefHat },
  { href: '/perfil', label: 'Perfil', Icon: User },
]

interface SidebarProps {
  userEmail: string
  subscriptionStatus: string
}

export function Sidebar({ userEmail, subscriptionStatus }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-zinc-100 bg-white">
      <div className="px-6 py-5 border-b border-zinc-100">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">Klarito</span>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-zinc-100 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-zinc-400">Plan</span>
          {subscriptionStatus === 'active'
            ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">Activo</Badge>
            : <Badge variant="outline" className="text-zinc-400 border-zinc-200 text-xs">Inactivo</Badge>}
        </div>
        <p className="text-xs text-zinc-400 truncate px-1">{userEmail}</p>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-zinc-500 hover:bg-zinc-50 hover:text-rose-500 transition-colors">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
