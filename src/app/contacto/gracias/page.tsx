import Link from 'next/link'

export default function GraciasContactoPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="w-full border-b border-zinc-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">Klarito</Link>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-5xl">✅</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-zinc-900">¡Mensaje recibido!</h1>
            <p className="text-zinc-500">Te responderemos a la brevedad en el correo que nos dejaste.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
