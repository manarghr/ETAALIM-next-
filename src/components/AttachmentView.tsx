"use client";

import { Attachment, humanSize } from "@/lib/messages";

// A message row is data OTHER PEOPLE wrote. Our chat box only ever produces a
// base64 `data:` URL from a picked file, but nothing stops a sender from calling
// the API directly and storing `javascript:steal(document.cookie)` in that
// field — and a link like that runs *in the reader's page* the moment they click
// it. So the URL is checked here, at the moment it becomes a real href.
//
// Allowed: https, blob:, and data: — except the data: types a browser will
// happily execute as markup (HTML, SVG). Everything else renders as a dead chip.
function isSafeAttachmentUrl(url: string): boolean {
  const u = url.trim();
  if (/^data:/i.test(u)) {
    return !/^data:\s*(text\/html|image\/svg\+xml|application\/xhtml)/i.test(u);
  }
  return /^(https:|blob:)/i.test(u);
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 10,
  background: "rgba(0,0,0,0.06)",
  color: "inherit",
  textDecoration: "none",
  fontSize: 13,
};

// Renders a message attachment inside a chat bubble: an inline image thumbnail
// (opens full-size in a new tab) or a downloadable file chip.
export default function AttachmentView({
  attachment,
}: {
  attachment: Attachment;
}) {
  const safe = isSafeAttachmentUrl(attachment.dataUrl);

  if (!safe) {
    return (
      <span style={{ ...chipStyle, opacity: 0.7 }}>
        <i className="fa fa-ban"></i>
        <span style={{ fontWeight: 600 }}>{attachment.name}</span>
        <span style={{ opacity: 0.7 }}>blocked attachment</span>
      </span>
    );
  }

  if (attachment.kind === "image") {
    return (
      <a href={attachment.dataUrl} target="_blank" rel="noreferrer noopener">
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
    <a href={attachment.dataUrl} download={attachment.name} style={chipStyle}>
      <i className="fa fa-file-o"></i>
      <span style={{ fontWeight: 600 }}>{attachment.name}</span>
      <span style={{ opacity: 0.7 }}>{humanSize(attachment.size)}</span>
    </a>
  );
}
