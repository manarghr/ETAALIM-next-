"use client";

import { useEffect, useState } from "react";


interface Course {
  id: number;
  subject: string;
  description: string | null;
  tier: string;
  major: string;
  price: number;
  status: string;
}

export default function ApiTest() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // call api and drop the result into state.
    // api returns { data: [...] }, so read json.data.
    fetch("/api/courses")
      .then((res) => res.json() as Promise<{ data: Course[] }>)
      .then((json) => setCourses(json.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Loading…</p>;

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Courses from Supabase ({courses.length})</h1>
      <ul>
        {courses.map((c) => (
          <li key={c.id} style={{ marginBottom: 12 }}>
            <b>{c.subject}</b> — {c.tier} · {c.price} DA
            <br />
            <small>{c.description}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
