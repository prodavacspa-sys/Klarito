import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Calculator,
  BarChart3,
  CheckCircle2,
  Gift,
  Share2,
  UserPlus,
  Banknote,
} from "lucide-react";
import { RegistroModal } from "@/components/landing/registro-modal";

const features = [
  {
    icon: BarChart3,
    title: "Dashboard en tiempo real",
    description:
      "Visualiza tus ventas, gastos y punto de equilibrio de un vistazo.",
  },
  {
    icon: Package,
    title: "Inventario",
    description:
      "Controla stock, costos y márgenes de todos tus productos.",
  },
  {
    icon: ShoppingCart,
    title: "Ventas",
    description:
      "Registra ventas con detalle por producto y lleva el control diario.",
  },
  {
    icon: Receipt,
    title: "Gastos",
    description:
      "Separa gastos fijos y variables. Calcula tu crédito de IVA automáticamente.",
  },
  {
    icon: Calculator,
    title: "Costos y recetas",
    description:
      "Calcula el costo real de cada producto con recetas e insumos.",
  },
  {
    icon: TrendingUp,
    title: "Punto de equilibrio",
    description:
      "Sabe exactamente cuánto necesitas vender para cubrir tus costos.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Nav */}
      <nav className="w-full border-b border-zinc-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            Klarito
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="text-sm font-medium bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Prueba gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="w-full pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
            Tu negocio bajo control,
            <br />
            <span className="text-zinc-500">sin complicaciones.</span>
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto">
            Klarito es el ERP simple para emprendedores chilenos. Controla
            ventas, gastos, inventario y punto de equilibrio desde un solo
            lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <RegistroModal />
            <span className="text-sm text-zinc-400">
              Sin tarjeta de crédito
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-16 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-zinc-900 text-center mb-12">
            Todo lo que necesitas para administrar tu negocio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-zinc-100 rounded-xl p-6 space-y-3"
              >
                <f.icon className="h-5 w-5 text-zinc-400" />
                <h3 className="font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referidos */}
      <section className="w-full py-20 px-6 bg-emerald-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-14">
            <span className="inline-flex items-center gap-1.5 bg-emerald-900 text-emerald-300 text-xs font-medium px-3 py-1 rounded-full">
              <Gift className="h-3.5 w-3.5" />
              Programa de referidos
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Invita amigos y usa <br />
              <span className="text-emerald-400">Klarito gratis.</span>
            </h2>
            <p className="text-emerald-200/70 max-w-md mx-auto text-base">
              Cada emprendedor que invites y pague su primer mes te da{" "}
              <strong className="text-emerald-300">$500 de crédito</strong>.
              Con 10 referidos, tu suscripción es completamente gratis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            {[
              {
                icon: Share2,
                step: "1",
                title: "Comparte tu enlace",
                desc: "Desde tu panel obtienes un enlace único de referido para compartir.",
              },
              {
                icon: UserPlus,
                step: "2",
                title: "Tu amigo se registra",
                desc: "Se crea una cuenta usando tu enlace y activa su suscripción.",
              },
              {
                icon: Banknote,
                step: "3",
                title: "Tú recibes $500",
                desc: "El crédito se aplica automáticamente a tu próxima factura.",
              },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div
                key={step}
                className="bg-emerald-900/40 border border-emerald-800/50 rounded-2xl p-6 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-400 text-emerald-950 text-xs font-bold flex-shrink-0">
                    {step}
                  </span>
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-emerald-200/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-emerald-400 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-emerald-950 font-bold text-xl leading-tight">
                10 referidos = servicio gratis
              </p>
              <p className="text-emerald-800 text-sm mt-1">
                $500 × 10 = $5.170 — exactamente el valor mensual de Klarito.
              </p>
            </div>
            <RegistroModal variant="referral" />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="w-full py-20 px-6">
        <div className="max-w-md mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900">
              Un solo plan, sin sorpresas
            </h2>
            <p className="text-sm text-zinc-500">
              Acceso completo a todas las funcionalidades.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-8 space-y-6">
            <div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-zinc-900">
                  $4.344
                </span>
                <span className="text-zinc-500 text-sm">+ IVA /mes</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                $5.170 total con IVA
              </p>
            </div>

            <ul className="space-y-3 text-left">
              {[
                "Dashboard con punto de equilibrio",
                "Inventario ilimitado",
                "Registro de ventas y gastos",
                "Cálculo de costos con recetas",
                "Estimación de IVA (F29)",
                "Soporte por email",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm text-zinc-600"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="w-full flex justify-center">
              <RegistroModal fullWidth />
            </div>
            <p className="text-xs text-zinc-400">
              Cancela cuando quieras. Sin permanencia.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <span>&copy; {new Date().getFullYear()} Klarito</span>
          <a href="mailto:hola@klarito.cl" className="hover:text-zinc-600 transition-colors">
            hola@klarito.cl
          </a>
        </div>
      </footer>
    </div>
  );
}
