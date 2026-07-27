import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let client: BrowserClient | undefined;

/**
 * Singleton Supabase client for the browser. Auth session is stored in cookies
 * (shared with the server via @supabase/ssr) and all data access is scoped to
 * the signed-in user by RLS.
 */
export function getSupabaseBrowserClient(): BrowserClient {
  if (!client) {
    client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_KEY);
  }
  return client;
}
