export default function CuentaExpiradaPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-5xl">⏰</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-900">Tu período de prueba ha terminado</h1>
          <p className="text-sm text-zinc-500">
            Tu acceso gratuito de 7 días ha expirado. Activa tu suscripción para seguir usando Klarito.
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Tus datos se conservarán por 30 días más.
          </p>
        </div>
        <a
          href="/suscripcion/activar"
          className="inline-flex items-center justify-center w-full bg-zinc-900 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Activar suscripción — $5.950/mes
        </a>
        <a href="/login" className="block text-sm text-zinc-400 hover:text-zinc-600">
          Cerrar sesión
        </a>
      </div>
    </div>
  )
}
