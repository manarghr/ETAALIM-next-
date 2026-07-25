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

export interface WalletTx {
  id: number;
  type: "topup" | "purchase";
  amount: number;
  subject: string | null; // English course subject (for purchases)
  date: string;
}

// The user's wallet history (top-ups + purchases), newest first.
export async function getTransactions(): Promise<WalletTx[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, type, amount, subject, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((t) => ({
    id: t.id as number,
    type: (t.type as string) === "topup" ? "topup" : "purchase",
    amount: t.amount as number,
    subject: (t.subject as string) ?? null,
    date: t.created_at as string,
  }));
}
