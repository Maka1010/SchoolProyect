"use client";

import { useEffect, useId, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: number;
};

const STORAGE_KEY = "schooltask.products.v1";

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

export default function Page() {
  const seedId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRaw, setPriceRaw] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial desde LocalStorage (solo cliente).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const sanitized: Product[] = parsed
        .filter((p) => p && typeof p === "object")
        .map((p) => p as Partial<Product>)
        .filter(
          (p) =>
            typeof p.id === "string" &&
            typeof p.name === "string" &&
            typeof p.description === "string" &&
            typeof p.price === "number" &&
            Number.isFinite(p.price) &&
            typeof p.createdAt === "number"
        )
        .map((p) => ({
          id: p.id as string,
          name: p.name as string,
          description: p.description as string,
          price: Math.round((p.price as number) * 100) / 100,
          createdAt: p.createdAt as number,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);

      setProducts(sanitized);
    } catch {
      // Si hay datos corruptos, ignoramos y continuamos.
    }
  }, []);

  // Guardado automático en LocalStorage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Si falla (quota / modo privado), no bloqueamos la app.
    }
  }, [products]);

  const total = useMemo(() => products.reduce((acc, p) => acc + p.price, 0), [products]);

  function onAdd() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const price = normalizePrice(priceRaw);

    if (!trimmedName) return setError("El nombre del producto es obligatorio.");
    if (!trimmedDesc) return setError("La descripción del producto es obligatoria.");
    if (price === null) return setError("Ingresa un precio válido (ej. 199.99).");
    if (price === 0) return setError("El precio debe ser mayor a 0.");

    const now = Date.now();
    const next: Product = {
      id: `${seedId}-${now}-${Math.random().toString(16).slice(2)}`,
      name: trimmedName,
      description: trimmedDesc,
      price,
      createdAt: now,
    };

    setProducts((prev) => [next, ...prev]);
    setName("");
    setDescription("");
    setPriceRaw("");
  }

  function onRemove(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function onClearAll() {
    setError(null);
    if (products.length === 0) return;
    const ok = window.confirm("¿Seguro que quieres vaciar la lista de productos?");
    if (!ok) return;
    setProducts([]);
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
              disabled={products.length === 0}
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

