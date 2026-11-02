/** Client-side public configuration only. Never place server secrets in VITE_* variables. */
export function validatePublicEnv(values: Record<string, string | undefined>) {
  const url = values.VITE_SUPABASE_URL?.trim();
  const key = values.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const missing = [!url && "VITE_SUPABASE_URL", !key && "VITE_SUPABASE_PUBLISHABLE_KEY"].filter(Boolean);
  if (missing.length) throw new Error(`TotalsEngine configuration error: missing ${missing.join(", ")}`);
  let parsed: URL;
  try { parsed = new URL(url!); } catch { throw new Error("TotalsEngine configuration error: invalid VITE_SUPABASE_URL"); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname)))
    throw new Error("TotalsEngine configuration error: VITE_SUPABASE_URL must use HTTPS");
  return { supabaseUrl: parsed.toString().replace(/\/$/, ""), supabasePublishableKey: key! };
}
export const publicEnv = validatePublicEnv(import.meta.env);
