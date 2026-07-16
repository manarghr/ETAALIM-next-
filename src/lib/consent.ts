// Parental-consent requests for under-18 students. A wallet purchase by a minor
// creates a pending request ("emailed" to the parent) that must be approved
// before the transaction commits. Mocked with localStorage for the demo.
export interface ConsentRequest {
  id: string;
  courseId: number;
  courseName: string;
  amount: number; // DZD
  mode: string;
  parentEmail: string;
  status: "pending" | "approved" | "denied";
  createdAt: string; // ISO
}

const KEY = "etaalim.consent";

function read(): ConsentRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConsentRequest[]) : [];
  } catch {
    return [];
  }
}

function write(list: ConsentRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getConsentRequests(): ConsentRequest[] {
  return read();
}

export function createConsentRequest(
  data: Omit<ConsentRequest, "id" | "status" | "createdAt">
): ConsentRequest {
  const req: ConsentRequest = {
    ...data,
    id: Math.random().toString(36).slice(2, 10),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  write([req, ...read()]);
  return req;
}

export function setConsentStatus(
  id: string,
  status: "approved" | "denied"
): ConsentRequest | undefined {
  const list = read();
  const req = list.find((r) => r.id === id);
  if (req) {
    req.status = status;
    write(list);
  }
  return req;
}
