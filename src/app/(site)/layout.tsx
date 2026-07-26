import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MessageNotifier from "@/components/MessageNotifier";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <MessageNotifier />
    </>
  );
}
