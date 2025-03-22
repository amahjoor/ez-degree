import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "iWannaGraduate - GMU Course Planning Tool",
  description: "A tool to help GMU students navigate degree requirements and plan their courses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <nav className="bg-blue-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href="/" className="font-bold text-xl">
              iWannaGraduate
            </Link>
            <div className="flex space-x-4">
              <Link href="/" className="hover:text-blue-200">
                Courses
              </Link>
              <Link href="/subjects" className="hover:text-blue-200">
                Subjects
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen py-4">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} iWannaGraduate - GMU Course Planning Tool</p>
            <p className="text-gray-400 text-sm mt-1">
              Helping students navigate their degree requirements since 2023
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
