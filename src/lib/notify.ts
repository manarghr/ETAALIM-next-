// App-wide "new message" notifications. Works for whoever is logged in: a
// student is notified of mentor replies, a mentor of student DMs. Used by the
// global <MessageNotifier> so the toast shows on every page, not just the
// dashboard.
import { createClient } from "@/lib/supabase/client";

export interface IncomingMessage {
  /** display name of whoever sent it (may be empty — caller supplies a fallback) */
  fromName: string;
  /** true when the recipient is the mentor (drives where "open" navigates) */
  toMentor: boolean;
}

export function subscribeIncomingMessages(
  onIncoming: (msg: IncomingMessage) => void
): () => void {
  const supabase = createClient();
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let cancelled = false;

  (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || cancelled) return;

    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isMentor = me?.role === "mentor";
    const filterCol = isMentor ? "mentor_id" : "student_id";
    const wantSender = isMentor ? "student" : "mentor";

    channel = supabase
      .channel(`notify-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `${filterCol}=eq.${user.id}`,
        },
        async (payload) => {
          const row = payload.new as {
            sender: string;
            student_id: string;
            mentor_id: string;
          };
          if (row.sender !== wantSender) return; // ignore our own messages

          const senderId = isMentor ? row.student_id : row.mentor_id;
          const { data: p } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", senderId)
            .maybeSingle();

          onIncoming({ fromName: (p?.name as string) ?? "", toMentor: isMentor });
        }
      )
      .subscribe();
  })();

  return () => {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
