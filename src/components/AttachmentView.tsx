"use client";

import { Attachment, humanSize } from "@/lib/messages";

// Renders a message attachment inside a chat bubble: an inline image thumbnail
// (opens full-size in a new tab) or a downloadable file chip.
export default function AttachmentView({
  attachment,
}: {
  attachment: Attachment;
}) {
  if (attachment.kind === "image") {
    return (
      <a href={attachment.dataUrl} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          style={{
            maxWidth: 220,
            maxHeight: 220,
            borderRadius: 10,
            display: "block",
          }}
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.dataUrl}
      download={attachment.name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.06)",
        color: "inherit",
        textDecoration: "none",
        fontSize: 13,
      }}
    >
      <i className="fa fa-file-o"></i>
      <span style={{ fontWeight: 600 }}>{attachment.name}</span>
      <span style={{ opacity: 0.7 }}>{humanSize(attachment.size)}</span>
    </a>
  );
}
