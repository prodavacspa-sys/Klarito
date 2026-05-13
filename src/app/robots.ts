import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/perfil', '/inventario', '/ventas', '/gastos'],
    },
    sitemap: 'https://www.klarito.cl/sitemap.xml',
  }
}
