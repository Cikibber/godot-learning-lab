import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "teacher" | "student";
export type Actor = {
  id: string;
  role: Role;
  displayName: string;
  locale: "id" | "en";
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/**
 * Verified identity (getClaims validates the JWT) plus the role from the
 * database, never from client-supplied data or JWT metadata alone.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return null;
  const { data: profile } = await supabase.from("profiles").select("role, display_name, locale").eq("id", sub).single();
  if (!profile) return null;
  return { id: sub, role: profile.role, displayName: profile.display_name, locale: profile.locale, supabase };
});

export async function requireRole(role: Role): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/sign-in");
  if (actor.role !== role) redirect(actor.role === "teacher" ? "/teacher" : "/student");
  return actor;
}

/** For server actions: never redirect mid-mutation, just refuse. */
export async function actorFor(role: Role): Promise<Actor | null> {
  const actor = await getActor();
  return actor && actor.role === role ? actor : null;
}
