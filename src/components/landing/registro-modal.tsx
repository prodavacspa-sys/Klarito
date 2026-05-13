'use client'

import { ArrowRight } from 'lucide-react'

export function RegistroModal({ fullWidth, variant }: { fullWidth?: boolean; variant?: 'referral' }) {
  return (
    <a
      href="/registro"
      className={`inline-flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-lg transition-colors text-base cursor-pointer${fullWidth ? ' w-full' : ''}${variant === 'referral' ? ' bg-emerald-950 text-white hover:bg-emerald-900' : ' bg-zinc-900 text-white hover:bg-zinc-700'}`}
    >
      Empieza gratis por 7 días
      <ArrowRight className="h-4 w-4" />
    </a>
  )
}
