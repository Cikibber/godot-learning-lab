"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { setLocale, signOut } from "@/features/auth/actions";
import { clearAllLocalDrafts } from "@/lib/draft-cache";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="sr-only sm:not-sr-only">{t("language")}</span>
      <select
        className="field w-auto min-h-9 py-1 text-sm"
        value={locale}
        disabled={pending}
        // refresh() re-renders server text in place: client drafts and the
        // current page are preserved.
        onChange={(e) => start(async () => { await setLocale(e.target.value as "id" | "en"); router.refresh(); })}
      >
        <option value="id">Bahasa Indonesia</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

export function SignOutButton() {
  const t = useTranslations("common");
  return (
    <form action={signOut} onSubmit={() => clearAllLocalDrafts()}>
      <button type="submit" className="btn btn-sm btn-quiet border-line">{t("signOut")}</button>
    </form>
  );
}

export function ConnectionStatus() {
  const t = useTranslations("common");
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <span role="status" className={`inline-flex items-center gap-1.5 text-xs font-semibold ${online ? "text-muted" : "text-bad"}`}>
      <span aria-hidden="true" className={`size-2 rounded-full ${online ? "bg-brand" : "bg-bad"}`} />
      {online ? t("online") : t("offline")}
    </span>
  );
}
