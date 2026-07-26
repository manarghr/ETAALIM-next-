"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { tr, mentorDisplayName } from "@/data/localized";
import { getMentorById } from "@/data/mentors";
import {
  getThread,
  sendMessage,
  subscribeThread,
  Attachment,
  Message,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/messages";
import styles from "./ChatDock.module.css";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * LinkedIn-style docked chat: pinned to the bottom corner, collapses to a
 * header "banner" when minimized, closes entirely. Owns its own composer and
 * reads/writes the message store directly.
 */
export default function ChatDock({
  mentorId,
  minimized,
  onToggleMinimize,
  onClose,
}: {
  mentorId: number;
  minimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Attachment | null>(null);
  const [thread, setThread] = useState<Message[]>([]);
  const [sizeError, setSizeError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const mentor = getMentorById(mentorId);

  // Load the conversation with this mentor from Supabase, then keep it live so
  // the mentor's replies appear without a refresh.
  useEffect(() => {
    getThread(mentorId).then(setThread);
    const unsubscribe = subscribeThread(mentorId, () => {
      getThread(mentorId).then(setThread);
    });
    return unsubscribe;
  }, [mentorId]);

  // Scroll to the newest message whenever the thread grows or we expand.
  useEffect(() => {
    if (!minimized && threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [thread, minimized]);

  if (!mentor) return null;

  const name = mentorDisplayName(mentor, locale);
  const canSend = text.trim().length > 0 || pending !== null;

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const reader = new FileReader();
    reader.onload = () => {
      setPending({
        kind: file.type.startsWith("image/") ? "image" : "file",
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!canSend) return;
    const updated = await sendMessage(mentorId, text.trim(), pending ?? undefined);
    setText("");
    setPending(null);
    setThread(updated);
  };

  return (
    <div className={`${styles.dock} ${minimized ? styles.dockMin : ""}`}>
      {/* Header — click anywhere on it to minimize/restore */}
      <div
        className={styles.head}
        onClick={onToggleMinimize}
        role="button"
        aria-expanded={!minimized}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.avatar} src={mentor.profilePicture} alt={name} />
        <div className={styles.headInfo}>
          <b>{name}</b>
          <span>{tr(mentor.major, locale)}</span>
        </div>
        <div className={styles.headActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            aria-label={minimized ? t("chat.expand") : t("chat.minimize")}
          >
            <i className={`fa ${minimized ? "fa-angle-up" : "fa-angle-down"}`}></i>
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={t("chat.close")}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>
      </div>

      {/* Body — hidden while minimized (the header alone is the banner) */}
      {!minimized && (
        <>
          <div className={styles.thread} ref={threadRef}>
            {thread.length === 0 ? (
              <p className={styles.empty}>
                {t("dash.msgStart", { name: mentor.name.split(" ")[0] })}
              </p>
            ) : (
              thread.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.bubble} ${
                    m.from === "student" ? styles.mine : styles.theirs
                  }`}
                >
                  {m.attachment?.kind === "image" && (
                    <a href={m.attachment.dataUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className={styles.attachImg}
                        src={m.attachment.dataUrl}
                        alt={m.attachment.name}
                      />
                    </a>
                  )}
                  {m.attachment?.kind === "file" && (
                    <a
                      className={styles.attachFile}
                      href={m.attachment.dataUrl}
                      download={m.attachment.name}
                    >
                      <i className="fa fa-file-o"></i>
                      <span className={styles.attachName}>{m.attachment.name}</span>
                      <span className={styles.attachSize}>
                        {humanSize(m.attachment.size)}
                      </span>
                    </a>
                  )}
                  {m.text && <span className={styles.bubbleText}>{m.text}</span>}
                </div>
              ))
            )}
          </div>

          {/* Pending attachment preview */}
          {pending && (
            <div className={styles.pending}>
              {pending.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.pendingThumb} src={pending.dataUrl} alt="" />
              ) : (
                <i className={`fa fa-file-o ${styles.pendingIcon}`}></i>
              )}
              <span className={styles.pendingName}>{pending.name}</span>
              <button
                type="button"
                className={styles.pendingRemove}
                onClick={() => setPending(null)}
                aria-label={t("chat.removeAttachment")}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
          )}

          {sizeError && (
            <div className={styles.sizeError}>
              {t("chat.tooLarge", { max: humanSize(MAX_ATTACHMENT_BYTES) })}
            </div>
          )}

          {/* Composer */}
          <div className={styles.composer}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
              hidden
              onChange={pickFile}
            />
            <button
              type="button"
              className={styles.attachBtn}
              onClick={() => fileRef.current?.click()}
              aria-label={t("chat.attach")}
            >
              <i className="fa fa-paperclip"></i>
            </button>
            <input
              className={styles.input}
              type="text"
              placeholder={t("dash.msgPlaceholder")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={send}
              disabled={!canSend}
              aria-label={t("chat.send")}
            >
              <i className="fa fa-paper-plane"></i>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
