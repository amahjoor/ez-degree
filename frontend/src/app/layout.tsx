"use client";

import localFont from "next/font/local";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

/* -------------------------------------------------------------------------- */
/* Local variable fonts                                                       */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/* Root layout                                                                */
/* -------------------------------------------------------------------------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>4yrplan</title>
        <meta
          name="description"
          content="A tool to help GMU students navigate degree requirements and plan their courses"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable}
          flex min-h-screen flex-col bg-gray-50 font-sans antialiased`}
      >
        {/* ------------------------------------------------------------------ */}
        {/*  Navbar                                                           */}
        {/* ------------------------------------------------------------------ */}
        <nav className="fixed inset-x-0 top-0 z-40">
          <div
            className="
              flex items-center justify-between
              border-b border-white/10
              bg-gradient-to-b from-zinc-950/80 to-zinc-950/40
              px-4 py-3 backdrop-blur-lg shadow-lg sm:px-8
            "
          >
            {/* Logo -------------------------------------------------------- */}
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-white/90 hover:text-white"
            >
              4yr<span className="text-primary-green">plan</span>
            </Link>

            {/* Links ------------------------------------------------------- */}
            <div className="flex gap-10 text-sm font-medium">
              {[
                { href: "/search", label: "Search" },
                { href: "/plan", label: "Plan" },
              ].map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group/nav relative transition-colors ${
                      active
                        ? "text-white"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    {label}
                    {/* animated gradient underline */}
                    <span
                      className={`
                        absolute -bottom-1 left-0 h-0.5 w-full origin-left
                        ${active ? "scale-x-100" : "scale-x-0"}
                        bg-gradient-to-r from-primary-green to-primary-blue
                        transition-transform duration-300 ease-out
                        group-hover/nav:scale-x-100
                      `}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* push content below fixed navbar */}
        <main className="flex-grow pt-16 sm:pt-0">{children}</main>
      </body>
    </html>
  );
}
