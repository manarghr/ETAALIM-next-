"use client";

// Fallback for student ids that aren't in the demo directory — i.e. accounts
// registered through the signup form, which live client-side.
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentRecord } from "@/data/students";
import { getRegisteredStudent } from "@/lib/registeredStudents";
import StudentProfileClient from "./StudentProfileClient";

export default function StudentResolver({ id }: { id: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentRecord | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudent(getRegisteredStudent(id) ?? null);
  }, [id]);

  useEffect(() => {
    if (student === null) router.replace("/admin");
  }, [student, router]);

  if (!student) return null;
  return <StudentProfileClient student={student} />;
}
