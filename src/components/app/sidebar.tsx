'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Receipt, LogOut, ChefHat, User, Gift, Menu, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/inventario', label: 'Inventario', Icon: Package },
  { href: '/ventas', label: 'Ventas', Icon: ShoppingCart },
  { href: '/gastos', label: 'Gastos', Icon: Receipt },
  { href: '/costos', label: 'Costos', Icon: ChefHat },
  { href: '/perfil', label: 'Perfil', Icon: User },
  { href: '/referidos', label: 'Referidos', Icon: Gift },
]

const bottomNavItems = [
  { href: '/dashboard', label: 'Inicio', Icon: LayoutDashboard },
  { href: '/ventas', label: 'Ventas', Icon: ShoppingCart },
  { href: '/gastos', label: 'Gastos', Icon: Receipt },
  { href: '/inventario', label: 'Inventario', Icon: Package },
  { href: '/perfil', label: 'Perfil', Icon: User },
]

interface SidebarProps {
  userEmail: string
  subscriptionStatus: string
}

export function Sidebar({ userEmail, subscriptionStatus }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ===== DESKTOP SIDEBAR (md+) ===== */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen border-r border-zinc-100 bg-white">
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

      {/* ===== MOBILE HEADER (< md) ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">Klarito</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-50"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ===== MOBILE DRAWER MENU ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between mt-14">
              <span className="text-base font-semibold text-zinc-900">{userEmail}</span>
              {subscriptionStatus === 'active'
                ? <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-xs">Activo</Badge>
                : <Badge variant="outline" className="text-zinc-400 border-zinc-200 text-xs">Inactivo</Badge>}
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map(({ href, label, Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-4 py-4 border-t border-zinc-100">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-zinc-500 hover:bg-zinc-50 hover:text-rose-500 transition-colors">
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-100 flex items-center justify-around px-2 py-2 safe-area-pb">
        {bottomNavItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive ? 'text-zinc-900' : 'text-zinc-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
