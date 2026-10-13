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
    <label className="flex items-center gap-2 text-sm">
      <span>{t("language")}</span>
      <select
        className="field w-auto py-1"
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
      <button type="submit" className="btn btn-sm">{t("signOut")}</button>
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
    <span role="status" className={`text-xs font-semibold ${online ? "text-ok" : "text-bad"}`}>
      <span aria-hidden="true">{online ? "● " : "✕ "}</span>
      {online ? t("online") : t("offline")}
    </span>
  );
}
