"use client";

import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

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
        <title>Patriot Assist</title>
        <meta name="description" content="A tool to help GMU students navigate degree requirements and plan their courses" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 font-sans flex flex-col min-h-screen`}
      >
        <nav className="bg-primary-blue text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-12">
              <Link href="/" className="font-bold text-xl hover:text-gray-200 transition-colors">
                Patriot Assist
              </Link>
              <div className="flex space-x-8">
                <Link 
                  href="/search" 
                  className={`font-medium text-lg hover:text-gray-200 transition-colors relative ${
                    pathname.startsWith('/search') ? 'font-bold' : ''
                  }`}
                >
                  Search
                  {pathname.startsWith('/search') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
                  )}
                </Link>
                <Link 
                  href="/plan" 
                  className={`font-medium text-lg hover:text-gray-200 transition-colors relative ${
                    pathname.startsWith('/plan') ? 'font-bold' : ''
                  }`}
                >
                  Plan
                  {pathname.startsWith('/plan') && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}
