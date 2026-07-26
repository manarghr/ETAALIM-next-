"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { subscribeIncomingMessages } from "@/lib/notify";
import MessageToast from "@/components/MessageToast";

/**
 * Mounted once in the site layout: listens for incoming messages anywhere in the
 * app and shows the slide-in toast, so a student/mentor is notified on any page
 * (not just their dashboard). Clicking it opens the right Messages panel.
 */
export default function MessageNotifier() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState<string | null>(null);
  const [path, setPath] = useState("/dashboard");

  useEffect(() => {
    const unsubscribe = subscribeIncomingMessages(({ fromName, toMentor }) => {
      setName(fromName || t(toMentor ? "mentorDash.aStudent" : "dash.aMentor"));
      setPath(toMentor ? "/mentor-dashboard" : "/dashboard");
    });
    return unsubscribe;
  }, [t]);

  if (!name) return null;

  return (
    <MessageToast
      name={name}
      onOpen={() => {
        router.push(`${path}?view=messages`);
        setName(null);
      }}
      onClose={() => setName(null)}
    />
  );
}
