import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolTask",
  description: "Tu agenda en orden, tu vida en orden.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-6">
          <header className="rounded-2xl border border-brand-sand/60 bg-white/70 p-4 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-brand-sand/70 bg-brand-paper">
                  <Image
                    src="/logo.png"
                    alt="Logo de SchoolTask"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <div className="text-xl font-semibold tracking-tight text-brand-brown">
                    SchoolTask
                  </div>
                  <div className="text-sm text-brand-gray">
                    “Tu agenda en orden, tu vida en orden.”
                  </div>
                </div>
              </div>

              <div className="text-sm text-brand-gray">
                Administra tus productos de forma simple.
              </div>
            </div>
          </header>

          <main className="flex-1 py-6">{children}</main>

          <footer className="rounded-2xl border border-brand-sand/60 bg-white/70 p-4 text-sm text-brand-gray shadow-soft backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <ul className="grid gap-1 sm:text-right">
                <li>Miramontes Duarte Angel Gabriel 6CPGM</li>
              </ul>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

