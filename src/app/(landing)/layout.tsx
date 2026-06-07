import Footer from "@/components/public/layout/footer";
import Navbar from "@/components/public/layout/navbar";

export const dynamic = "force-dynamic";

export default function LandingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
