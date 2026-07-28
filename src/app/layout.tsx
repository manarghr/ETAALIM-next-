import type { Metadata } from "next";
import { I18nProvider } from "@/i18n/I18nProvider";
import { siteUrl } from "@/lib/siteUrl";
import "./globals.css";

export const metadata: Metadata = {
  // Absolute base for every relative URL in metadata (OG images, canonicals).
  // Without it, a link shared on Facebook or WhatsApp shows no preview.
  metadataBase: new URL(siteUrl),
  title: "E-Taalim - Empowering Education",
  description:
    "A dynamic e-learning platform for all ages, from school students to professionals.",
  icons: { icon: "/images/logo.png" },
  openGraph: {
    type: "website",
    siteName: "E-Taalim",
    title: "E-Taalim - Empowering Education",
    description:
      "A dynamic e-learning platform for all ages, from school students to professionals.",
    images: ["/images/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "E-Taalim - Empowering Education",
    description:
      "A dynamic e-learning platform for all ages, from school students to professionals.",
  },
};

// The saved language lives in localStorage, which the server can't read — so
// the first paint used to be English/LTR for everyone, and Arabic visitors saw
// the whole page flip after hydration. This runs BEFORE the browser paints and
// fixes the two attributes that decide direction.
//
// It is a fixed string with no user input in it (the only thing read is
// compared against a whitelist of three locales). If the CSP is ever tightened
// to nonces, this tag needs the nonce.
const LANG_BOOTSTRAP = `try{var l=localStorage.getItem('lang');if(l==='ar'||l==='fr'||l==='en'){var d=document.documentElement;d.lang=l;d.dir=l==='ar'?'rtl':'ltr';}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the script above intentionally changes lang/dir
    // before React hydrates, so the attributes won't match the server HTML.
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />
        {/* Poppins (Latin) + IBM Plex Sans Arabic (Arabic) + Font Awesome 4.7, via CDN */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
