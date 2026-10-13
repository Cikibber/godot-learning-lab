import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";

export const createClient = () => createBrowserClient<Database>(env.supabaseUrl, env.supabaseKey);
