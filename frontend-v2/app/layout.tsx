import type { Metadata } from "next";
import "./globals.css";
import ClientOnly from "@/components/global/ClientOnly";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/global/Footer";

export const metadata: Metadata = {
  title: "ACM Curation Tool",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <ClientOnly>
          <Navbar />
        </ClientOnly>
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
