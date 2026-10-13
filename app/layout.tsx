import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { getActor } from "@/lib/auth/session";
import { ConnectionStatus, LocaleSwitcher, SignOutButton } from "@/components/HeaderControls";
import { BrandMark } from "@/components/Motif";
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
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-[3px] focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand">
            {t("skip")}
          </a>
          <header className="border-b border-line bg-recess">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5">
              <Link href={home} className="flex items-center gap-2.5 text-ink no-underline">
                <BrandMark size={30} />
                <span className="leading-none">
                  <span className="block font-[family-name:var(--font-display)] text-lg font-semibold [font-stretch:87.5%]">{t("appName")}</span>
                  <span className="block text-xs text-muted">{actor ? (actor.role === "teacher" ? t("roleTeacher") : t("roleStudent")) : t("brandLine")}</span>
                </span>
              </Link>
              <nav aria-label={t("mainNav")} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {actor?.role === "teacher" && <Link className="text-muted hover:text-ink" href="/teacher/plan">{t("plan")}</Link>}
                <Link className="text-muted hover:text-ink" href="/privacy">{t("privacy")}</Link>
                <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
                <ConnectionStatus />
                <LocaleSwitcher />
                {actor ? (
                  <span className="flex items-center gap-2">
                    <span className="hidden max-w-40 truncate text-muted md:inline">{actor.displayName}</span>
                    <SignOutButton />
                  </span>
                ) : (
                  <Link className="btn btn-sm" href="/sign-in">{t("signIn")}</Link>
                )}
              </nav>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
