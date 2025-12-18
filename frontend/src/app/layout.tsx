import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "eformsign Embedding Sample",
  description: "eformsign Embedding Sample",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-gray-50`}>
        <Sidebar />
        <div className="ml-64 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
