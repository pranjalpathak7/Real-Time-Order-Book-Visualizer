import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Real-Time Order Book",
  description: "Binance Order Book Visualizer for Two Cents Ventures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gray-950 text-gray-200 overflow-y-auto lg:overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}