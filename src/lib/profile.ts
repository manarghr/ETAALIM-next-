// The logged-in user's profile, read from Supabase.
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  name: string;
  email: string;
  phone: string | null;
  role: string;
  age: number | null;
  parentEmail: string | null;
  parentPhone: string | null;
  cycle: string | null;
  year: string | null;
  stream: string | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("profiles")
    .select("name, email, phone, role, age, parent_email, parent_phone, cycle, year, stream")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    age: data.age,
    parentEmail: data.parent_email,
    parentPhone: data.parent_phone,
    cycle: data.cycle,
    year: data.year,
    stream: data.stream,
  };
}
