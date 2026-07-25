import { createClient } from "@/lib/supabase/client";

// The current user's wallet balance (DZD). Returns null (not 0) when there's no
// session / no row, so a transient miss never overwrites a good value.
export async function getBalance(): Promise<number | null> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", session.user.id)
    .maybeSingle();

  return data?.balance ?? null;
}

// add money to the wallet via the top_up function. returns the NEW balance.
export async function topUp(amount: number): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("top_up", { p_amount: amount });
  if (error) throw new Error(error.message);
  return data as number;
}
