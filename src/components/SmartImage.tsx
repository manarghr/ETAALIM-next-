"use client";

// One image component for the whole site.
//
// Most of our pictures are files in /public (logos, illustrations, the seed
// mentors' photos) and those go through next/image: resized, converted to a
// modern format, lazy-loaded, and reserved space so the page doesn't jump.
//
// But a mentor's uploaded photo and a chat attachment are stored as base64
// `data:` URLs, and next/image cannot parse those at all — it throws. Remote
// URLs (a Google avatar) would need every host whitelisted in next.config.ts
// and blow up at runtime if one were missed. Both of those fall back to a plain
// <img>, still lazy-loaded, so nothing breaks.
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** Set on the one image that's visible before scrolling (the hero). */
  priority?: boolean;
}

export default function SmartImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
}: Props) {
  const isLocalFile = src.startsWith("/");

  if (!isLocalFile) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
