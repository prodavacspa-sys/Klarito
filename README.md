# Klarito

ERP Low Cost para el pueblo.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Supabase (auth + Postgres), Tailwind, shadcn/ui, Flow.cl (pagos/suscripciones), Resend (emails).

## Getting Started

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Variables de entorno requeridas (`.env.local`): ver `.env.local` local (no versionado). Incluye credenciales de Supabase, Flow y Resend — nunca commitear este archivo.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run lint` — eslint
