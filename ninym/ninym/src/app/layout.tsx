import type { Metadata } from "next";
import { Inter, Quantico } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });
const quantico = Quantico({weight: '400', subsets: ['latin']});

export const metadata: Metadata = {
  title: "Ninym",
  description: "Project Ninym",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={quantico.className}>
        <Providers>
          <Navbar />
          <main className="min-h-screen bg-dark transition-all duration-300 ease-in-out">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
