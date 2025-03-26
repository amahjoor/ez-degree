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
            <div className="flex items-center space-x-6">
              <Link href="/" className="font-bold text-xl">
                iWannaGraduate
              </Link>
              <Link href="/professors" className="hover:text-blue-200 transition-colors">
                Professors
              </Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen py-4">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; {new Date().getFullYear()} iWannaGraduate - Course Planning Tool</p>
            <p className="text-gray-400 text-sm mt-1">
              Made with ❤️ by Arman
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
