// Structured lessons for a course, generated deterministically from its major
// so every course has a believable curriculum without hand-authoring each one.
// Topic names come from getLessonsForMajor (English) and are translated at
// render time via tr(); the final entry is a graded quiz.
import { getLessonsForMajor } from "./courses";

export type LessonType = "video" | "reading" | "quiz";

export interface Lesson {
  id: string; // stable across renders (course id + index)
  topic: string; // English topic; "" for the quiz
  type: LessonType;
  minutes: number;
}

export function getLessons(courseId: number, major: string): Lesson[] {
  const topics = getLessonsForMajor(major);
  const lessons: Lesson[] = topics.flatMap((topic, i) => [
    {
      id: `${courseId}-${i}-v`,
      topic,
      type: "video" as const,
      minutes: 8 + ((courseId + i) % 6) * 3,
    },
    {
      id: `${courseId}-${i}-r`,
      topic,
      type: "reading" as const,
      minutes: 4 + ((courseId + i) % 4) * 2,
    },
  ]);
  lessons.push({ id: `${courseId}-quiz`, topic: "", type: "quiz", minutes: 12 });
  return lessons;
}

export function totalMinutes(lessons: Lesson[]): number {
  return lessons.reduce((sum, l) => sum + l.minutes, 0);
}
