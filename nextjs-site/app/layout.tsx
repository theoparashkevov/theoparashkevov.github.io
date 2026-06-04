import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Teo Parashkevov | Machine Learning Engineer",
  description: "Personal blog and portfolio of Teo Parashkevov, Machine Learning Engineer and Senior Python Developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-neutral-50 text-neutral-700">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Navigation />
          <main className="mt-8">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
