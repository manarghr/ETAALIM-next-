import { createClient } from "@supabase/supabase-js";
import { courses } from "@/data/courses";
import { NextResponse } from "next/server";

// ONE-TIME import of the static catalog into Supabase. Uses the service_role
// key (server-only) to bypass RLS. Delete this file after running it once.
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Map each static course to the table's columns (snake_case).
  const rows = courses.map((c) => ({
    id: c.id,
    subject: c.subject,
    description: null,
    tier: c.tier,
    track: c.track,
    year: c.year,
    major: c.major,
    level: c.level,
    status: c.status,
    session_date: c.date,
    session_time: c.time,
    price: c.price,
    price_group: c.priceGroup,
    price_individual: c.priceIndividual,
    mentor_id: c.mentorId,
  }));

  const { error } = await supabase.from("courses").insert(rows);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}
