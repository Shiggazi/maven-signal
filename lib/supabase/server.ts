import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function configured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
export async function serverClient() {
  if (!configured()) throw new Error("SETUP_REQUIRED");
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components use proxy for refresh. */
          }
        },
      },
    },
  );
}
export function permitted(email: string | undefined) {
  return (
    !!email &&
    (process.env.AGENCY_ALLOWED_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase())
  );
}
