// Fails loudly at startup when required public configuration is missing.
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseKey: required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
};
