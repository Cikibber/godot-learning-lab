// Operator tool: provision a teacher or student identity.
//
//   npm run provision -- --role teacher --email guru@school.sch.id --name "Bu Sari"
//   npm run provision -- --role student --email s1@school.sch.id --name "Siswa 01"
//
// Default: sends a Supabase invitation email (the user sets their own password
// via /auth/confirm → /account/password). `--password` creates a confirmed
// account directly and is refused unless the target is a local stack.
// Requires SUPABASE_SECRET_KEY in the operator's environment only.
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    role: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
    "set-role": { type: "boolean", default: false },
  },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
const fail = (m: string): never => {
  console.error(`provision: ${m}`);
  process.exit(1);
};

if (!url || !secret) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
const role = values.role === "teacher" ? "teacher" : values.role === "student" ? "student" : fail("--role teacher|student");
const email = values.email?.trim().toLowerCase() ?? fail("--email is required");
const name = values.name?.trim() ?? fail("--name is required (a school-approved display name)");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail("invalid email");
if (name.length < 1 || name.length > 60) fail("name must be 1-60 characters");

const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url!);
const admin = createClient(url!, secret!, { auth: { persistSession: false, autoRefreshToken: false } });
const app_metadata = { role, display_name: name };

if (values["set-role"]) {
  // Change role/name of an existing user (e.g. promote a provisioned teacher).
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users.find((u) => u.email === email) ?? fail("user not found");
  const { error } = await admin.auth.admin.updateUserById(user.id, { app_metadata });
  if (error) fail(error.message);
  console.log(`updated ${email} → ${role}`);
} else if (values.password) {
  if (!isLocal) fail("--password is only allowed against a local Supabase stack. Use invitations for real schools.");
  const { error } = await admin.auth.admin.createUser({ email, password: values.password, email_confirm: true, app_metadata });
  if (error) fail(error.message);
  console.log(`created local ${role} ${email}`);
} else {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/auth/confirm` });
  if (error) fail(error.message);
  const invited = data.user ?? fail("invite returned no user");
  const { error: metaError } = await admin.auth.admin.updateUserById(invited.id, { app_metadata });
  if (metaError) fail(metaError.message);
  console.log(`invited ${role} ${email}`);
}
