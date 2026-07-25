"use client";

// Resolves a student by id from Supabase (real registered accounts).
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentRecord } from "@/data/students";
import { getStudentById } from "@/lib/adminStudents";
import StudentProfileClient from "./StudentProfileClient";

export default function StudentResolver({ id }: { id: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentRecord | null | undefined>(undefined);

  useEffect(() => {
    getStudentById(id).then((s) => setStudent(s));
  }, [id]);

  useEffect(() => {
    if (student === null) router.replace("/admin");
  }, [student, router]);

  if (!student) return null;
  return <StudentProfileClient student={student} />;
}
