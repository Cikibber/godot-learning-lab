import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { getActor } from "@/lib/auth/session";
import { ConnectionStatus, LocaleSwitcher, SignOutButton } from "@/components/HeaderControls";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: { default: t("appName"), template: `%s · ${t("appName")}` }, description: t("tagline") };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("common");
  const actor = await getActor();
  const home = actor ? (actor.role === "teacher" ? "/teacher" : "/student") : "/";
  return (
    <html lang={locale}>
      <body className="min-h-screen">
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
            {t("skip")}
          </a>
          <header className="border-b border-line bg-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
              <Link href={home} className="font-bold text-ink no-underline">
                <span aria-hidden="true">◆ </span>{t("appName")}
              </Link>
              <nav aria-label={t("mainNav")} className="flex flex-wrap items-center gap-3">
                {actor?.role === "teacher" && <Link className="link text-sm" href="/teacher/plan">{t("plan")}</Link>}
                <Link className="link text-sm" href="/privacy">{t("privacy")}</Link>
                <ConnectionStatus />
                <LocaleSwitcher />
                {actor ? <SignOutButton /> : <Link className="btn btn-sm" href="/sign-in">{t("signIn")}</Link>}
              </nav>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
