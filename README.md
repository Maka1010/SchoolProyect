# SchoolTask

**Tu agenda en orden, tu vida en orden.**

Proyecto web con **Next.js + TypeScript + Tailwind CSS** y datos en **Supabase** (PostgreSQL).

## Requisitos

- Node.js (LTS recomendado)
- npm (o pnpm/yarn/bun)

## Conexión a Supabase

### 1) Variables de entorno

1. Copia `.env.local.example` a `.env.local` en la raíz del proyecto.
2. En Supabase: **Project Settings → API**, copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (o **anon public**) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Reinicia el servidor después de cambiar `.env.local`:

```bash
npm run dev
```

### 2) Tabla `public.products`

En **SQL Editor** de Supabase, crea (o ajusta) la tabla para que coincida con la app:

```sql
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10,2) not null check (price > 0),
  created_at timestamptz default now()
);

create index if not exists products_created_at_idx
on public.products (created_at desc);
```

Si no tienes `pgcrypto` para `gen_random_uuid()`:

```sql
create extension if not exists "pgcrypto";
```

### 3) Políticas RLS (acceso desde el navegador con la clave pública)

La app usa el cliente de Supabase en el **navegador** (rol `anon`). Con RLS activado necesitas políticas para `anon`. Ejemplo para un proyecto escolar / demo:

```sql
alter table public.products enable row level security;

drop policy if exists "products_read_public" on public.products;
drop policy if exists "products_insert_public" on public.products;
drop policy if exists "products_delete_public" on public.products;

create policy "products_read_public"
on public.products for select to anon using (true);

create policy "products_insert_public"
on public.products for insert to anon with check (true);

create policy "products_delete_public"
on public.products for delete to anon using (true);
```

> En producción conviene autenticación y políticas por usuario; esto es para que la app actual funcione sin login.

### 4) Probar la conexión

Con `.env.local` configurado:

```bash
npm run supabase:smoke
```

Debe mostrar `insert_error null` y datos de la fila insertada. Luego revisa **Table Editor → public → products**.

## Cómo correr la app

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Qué incluye

- Formulario de alta de producto (nombre, descripción, precio)
- Listado desde Supabase (total, quitar, vaciar)
- Cliente en `lib/supabaseClient.ts` y lógica en `app/page.tsx`
- Branding: paleta, logo (`public/logo.png`), header y footer
