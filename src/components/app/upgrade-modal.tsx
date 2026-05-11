'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type Reason = 'productos' | 'limite_productos' | 'gastos' | 'recetas'

interface Props {
  open: boolean
  onClose: () => void
  reason: Reason
}

const MESSAGES: Record<Reason, { title: string; description: string }> = {
  productos: {
    title: 'Límite del plan gratuito',
    description: 'El plan gratuito permite 1 producto. Activa tu suscripción para agregar productos ilimitados.',
  },
  limite_productos: {
    title: 'Límite de productos alcanzado',
    description: 'Has alcanzado el límite de 100 productos. Contacta a soporte si necesitas más.',
  },
  gastos: {
    title: 'Límite del plan gratuito',
    description: 'El plan gratuito permite 1 gasto. Activa tu suscripción para registrar gastos ilimitados.',
  },
  recetas: {
    title: 'Límite del plan gratuito',
    description: 'El plan gratuito permite 1 receta. Activa tu suscripción para crear recetas ilimitadas.',
  },
}

export function UpgradeModal({ open, onClose, reason }: Props) {
  const router = useRouter()
  const { title, description } = MESSAGES[reason]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-500">{description}</p>
        {(reason === 'productos' || reason === 'gastos' || reason === 'recetas') && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-zinc-900 hover:bg-zinc-700 text-white"
              onClick={() => { onClose(); router.push('/perfil') }}
            >
              Ver planes
            </Button>
            <Button variant="outline" className="flex-1 border-zinc-200" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        )}
        {reason === 'limite_productos' && (
          <Button className="w-full bg-zinc-900 hover:bg-zinc-700 text-white" onClick={onClose}>
            Entendido
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
