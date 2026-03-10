import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aegis Core | Secure Neural Interface",
  description: "The most advanced, 100% secure open-source AI infrastructure. Built for enterprise defense.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-black text-white min-h-screen selection:bg-cyan-500/30`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
