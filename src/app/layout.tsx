import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GTM } from "@/components/analytics/GTM";
import { MetaPixel } from "@/components/analytics/MetaPixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klarito — ERP simple para emprendedores chilenos",
  description: "Controla ventas, gastos, inventario y punto de equilibrio de tu negocio. Simple, accesible y hecho para Chile. Prueba 7 días gratis.",
  keywords: ["ERP Chile", "software emprendedores Chile", "control ventas", "inventario pymes", "punto de equilibrio", "gastos negocio"],
  metadataBase: new URL('https://www.klarito.cl'),
  openGraph: {
    title: "Klarito — ERP simple para emprendedores chilenos",
    description: "Controla ventas, gastos, inventario y punto de equilibrio. Hecho para Chile.",
    url: "https://www.klarito.cl",
    siteName: "Klarito",
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Klarito — ERP simple para emprendedores chilenos",
    description: "Controla ventas, gastos, inventario y punto de equilibrio. Hecho para Chile.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GTM />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
