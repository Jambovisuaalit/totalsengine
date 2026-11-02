export function validateBuildEnv(env) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error("Missing required VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error("Invalid VITE_SUPABASE_URL"); }
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname)))
    throw new Error("VITE_SUPABASE_URL must use HTTPS");
  return true;
}
