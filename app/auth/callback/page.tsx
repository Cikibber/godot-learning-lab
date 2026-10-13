"use client";
// Landing page for Supabase's default invite/recovery emails, which return the
// session in the URL fragment (#access_token=…). Used when custom email
// templates are unavailable (e.g. free tier with the built-in sender).
// The fragment never reaches the server; it is cleared immediately.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clearAllLocalDrafts } from "@/lib/draft-cache";

export default function AuthCallback() {
  const t = useTranslations("signIn");
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      // The URL fragment is external state only readable after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    clearAllLocalDrafts();
    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => (error ? setFailed(true) : router.replace("/account/password")));
  }, [router]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      {failed ? (
        <>
          <p role="alert" className="error">{t("linkInvalid")}</p>
          <Link className="btn" href="/sign-in">{t("title")}</Link>
        </>
      ) : (
        <p role="status">{t("pending")}</p>
      )}
    </div>
  );
}
