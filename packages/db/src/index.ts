import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseServiceClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export type {
  Playbook,
  Execution,
  Recording,
} from "@hack4her/playbooks";

// Playbook store (Capa 4 — MongoDB + filesystem fallback)
export {
  saveSavedPlaybook,
  listSavedPlaybooks,
  getSavedPlaybook,
  recallSimilarMappings,
  getStoreStatus,
} from "./playbook-store";
