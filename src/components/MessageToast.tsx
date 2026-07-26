"use client";

import { useEffect } from "react";
import styles from "./MessageToast.module.css";

/**
 * A slide-in "you've got a message" card pinned to the right of the screen.
 * Auto-dismisses after 8s; clicking the card opens the Messages panel.
 */
export default function MessageToast({
  name,
  onOpen,
  onClose,
}: {
  name: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 8000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div
      className={styles.toast}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className={styles.icon}>
        <i className="fa fa-comment"></i>
      </div>
      <div className={styles.body}>
        <b className={styles.title}>New message</b>
        <span className={styles.text}>
          You got a message from <b>{name}</b>
        </span>
      </div>
      <button
        type="button"
        className={styles.close}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Dismiss"
      >
        <i className="fa fa-times"></i>
      </button>
    </div>
  );
}
