"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: number;
};

function formatMXN(value: number) {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function normalizePrice(raw: string) {
  const cleaned = raw.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return Math.round(n * 100) / 100;
}

type DbProduct = {
  id?: string;
  name: string;
  description: string;
  price: number;
  created_at?: string;
};

function toUiProduct(p: DbProduct, seed: string, fallbackIndex: number): Product {
  return {
    id: p.id ?? `${seed}-${fallbackIndex}-${p.name}-${p.price}`,
    name: p.name,
    description: p.description,
    price: Math.round(Number(p.price) * 100) / 100,
    createdAt: p.created_at ? new Date(p.created_at).getTime() : 0,
  };
}

export default function Page() {
  const seedId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  async function loadProducts() {
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      // Algunas tablas "products" solo tienen name/description/price.
      // Intentamos primero con columnas comunes (id/created_at). Si no existen, hacemos fallback.
      let data: DbProduct[] | null = null;

      const attempt1 = await supabase
        .from("products")
        .select("id,name,description,price,created_at")
        .order("created_at", { ascending: false });

      if (!attempt1.error) {
        data = attempt1.data as DbProduct[];
      } else {
        const attempt2 = await supabase
          .from("products")
          .select("id,name,description,price")
          .order("id", { ascending: false });
        if (attempt2.error) throw attempt2.error;
        data = attempt2.data as DbProduct[];
      }

      const mapped: Product[] = (data ?? []).map((p, idx) => toUiProduct(p, seedId, idx));

      setProducts(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los productos.");
    } finally {
      setBusy(false);
    }
  }

  // Carga inicial desde Supabase.
  useEffect(() => {
    loadProducts();
  }, []);

  const total = useMemo(() => products.reduce((acc, p) => acc + p.price, 0), [products]);

  async function onAdd() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const price = normalizePrice(priceRaw);

    if (!trimmedName) return setError("El nombre del producto es obligatorio.");
    if (!trimmedDesc) return setError("La descripción del producto es obligatoria.");
    if (price === null) return setError("Ingresa un precio válido (ej. 199.99).");
    if (price === 0) return setError("El precio debe ser mayor a 0.");

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: trimmedName,
          description: trimmedDesc,
          price,
        })
        // Pedimos que regrese la fila insertada: si esto falla,
        // NO actualizamos la UI y verás el error real.
        .select("id,name,description,price,created_at")
        .single();
      if (error) throw error;

      const inserted = data as DbProduct;
      const mapped = toUiProduct(inserted, seedId, 0);
      setProducts((prev) => [mapped, ...prev]);
      setName("");
      setDescription("");
      setPriceRaw("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar el producto.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setError(null);
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      // Nota: si tu tabla no tiene columna id, este borrado no funcionará.
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo quitar el producto.");
    } finally {
      setBusy(false);
    }
  }

  async function onClearAll() {
    setError(null);
    if (products.length === 0) return;
    const ok = window.confirm("¿Seguro que quieres vaciar la lista de productos?");
    if (!ok) return;
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("products")
        .delete()
        // PostgREST requiere un filtro; este truco borra "todo".
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo vaciar la lista.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-brand-sand/60 bg-white/80 p-5 shadow-soft backdrop-blur">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-brand-brown">Alta de producto</h2>
          <p className="text-sm text-brand-gray">
            Captura el producto, su descripción y el precio. Luego agrégalo.
          </p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-brand-ink">Producto</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Cuaderno profesional"
              className="rounded-xl border border-brand-sand bg-brand-paper/40 px-3 py-2 text-brand-ink outline-none ring-brand-terracotta/30 focus:ring-4"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-brand-ink">Detalle / descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. 100 hojas, pasta dura, rayado."
              rows={4}
              className="resize-none rounded-xl border border-brand-sand bg-brand-paper/40 px-3 py-2 text-brand-ink outline-none ring-brand-terracotta/30 focus:ring-4"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-brand-ink">Valor / precio</span>
            <input
              value={priceRaw}
              onChange={(e) => setPriceRaw(e.target.value)}
              inputMode="decimal"
              placeholder="Ej. 199.99"
              className="rounded-xl border border-brand-sand bg-brand-paper/40 px-3 py-2 text-brand-ink outline-none ring-brand-terracotta/30 focus:ring-4"
            />
            <span className="text-xs text-brand-gray">
              Se guarda como MXN con 2 decimales.
            </span>
          </label>

          {error ? (
            <div className="rounded-xl border border-brand-terracotta/30 bg-brand-terracotta/10 px-3 py-2 text-sm text-brand-brown">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onAdd}
            disabled={busy}
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-brand-terracotta px-4 py-2 font-semibold text-white shadow-soft transition hover:brightness-110 active:translate-y-px"
          >
            Agregar producto
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-sand/60 bg-white/80 p-5 shadow-soft backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-brown">Productos dados de alta</h2>
            <p className="text-sm text-brand-gray">
              {products.length === 0
                ? "Aún no hay productos. Agrega el primero desde el formulario."
                : `Total: ${products.length} producto(s) · Suma: ${formatMXN(total)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-brand-sand bg-brand-paper/50 px-3 py-2 text-sm text-brand-ink">
              {formatMXN(total)}
            </div>
            <button
              type="button"
              onClick={onClearAll}
              disabled={busy || products.length === 0}
              className="rounded-xl border border-brand-sand bg-white px-3 py-2 text-sm font-semibold text-brand-gray transition hover:bg-brand-paper disabled:cursor-not-allowed disabled:opacity-60"
              title="Vaciar lista"
            >
              Vaciar
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-sand bg-brand-paper/40 p-6 text-center text-sm text-brand-gray">
              Tu lista se verá aquí.
            </div>
          ) : (
            products.map((p) => (
              <article
                key={p.id}
                className="rounded-2xl border border-brand-sand/70 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-brand-ink">
                      {p.name}
                    </div>
                    <div className="mt-1 text-sm text-brand-gray">{p.description}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-base font-semibold text-brand-brown">
                      {formatMXN(p.price)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(p.id)}
                      disabled={busy}
                      className="mt-2 rounded-lg border border-brand-sand px-2 py-1 text-xs font-semibold text-brand-gray transition hover:bg-brand-paper"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

