import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const LOCALE_COOKIE = "gll_locale";

// Bahasa Indonesia is the default even when the browser prefers English; only
// an explicit saved choice (cookie, synced from the profile) overrides it.
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = saved === "en" ? "en" : "id";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: "Asia/Jakarta",
  };
});
