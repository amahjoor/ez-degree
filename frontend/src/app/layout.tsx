"use client";

import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";
import { AuthProvider } from "./account/AuthContext";
import { Nav } from "./components/Nav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  return (
    <html lang="en">
      <head>
        <title>ez degree</title>
        <meta name="description" content="A tool to help GMU students navigate degree requirements and plan their courses" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 font-sans flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <Nav />
          <main className="flex-grow">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}