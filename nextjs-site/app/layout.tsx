import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { generateSEO, generatePersonSchema } from "@/lib/seo/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = generateSEO({
  title: undefined,
  description: "Personal blog and portfolio of Teo Parashkevov, Machine Learning Engineer and Senior Python Developer",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F8FAFC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const personSchema = generatePersonSchema();

  return (
    <html lang="en" className={inter.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-700">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
        >
          Skip to main content
        </a>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Navigation />
          <main id="main-content" className="mt-8" role="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
