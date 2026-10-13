"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActor } from "@/lib/auth/session";
import { LOCALE_COOKIE } from "@/i18n/request";

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 };

export type FormState = { error?: string; ok?: boolean } | null;

const signInSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

export async function signIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: "signInFailed" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // One generic message: never reveal whether an account exists.
  if (error) return { error: "signInFailed" };
  const actor = await getActor();
  if (!actor) return { error: "signInFailed" };
  (await cookies()).set(LOCALE_COOKIE, actor.locale, cookieOpts);
  redirect(actor.role === "teacher" ? "/teacher" : "/student");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function setLocale(locale: "id" | "en") {
  const value = locale === "en" ? "en" : "id";
  (await cookies()).set(LOCALE_COOKIE, value, cookieOpts);
  const actor = await getActor();
  if (actor) await actor.supabase.from("profiles").update({ locale: value }).eq("id", actor.id);
}

const passwordSchema = z
  .object({ password: z.string().min(10).max(200), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "mismatch" });

/** Used after an invitation or recovery link has established a session. */
export async function setPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: fd.get("password"), confirm: fd.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message === "mismatch" ? "passwordMismatch" : "passwordShort" };
  const actor = await getActor();
  if (!actor) return { error: "sessionExpired" };
  const { error } = await actor.supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "generic" };
  redirect(actor.role === "teacher" ? "/teacher" : "/student");
}
