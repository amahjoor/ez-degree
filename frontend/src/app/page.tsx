"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Button } from "./components/ui/button";

import {
  CalendarCheck,
  Clock,
  BookOpen,
  Sparkles,
  MapPin,
  User,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import heroMock from "./assets/hero-mock.png";

// -----------------------------------------------------------------------------
// Helpers & variants
// -----------------------------------------------------------------------------
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <CalendarCheck className="h-8 w-8" />,
    title: "Smart Scheduling",
    description:
      "Conflict‑free schedules that respect seat availability, prerequisites, and your personal constraints.",
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Time Optimization",
    description:
      "Algorithms that slash idle gaps between classes so you reclaim your day.",
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: "Requirement Tracking",
    description:
      "Auto‑filter courses based on what you’ve already completed and what’s left to graduate.",
  },
  {
    icon: <User className="h-8 w-8" />,
    title: "Professor Insights",
    description:
      "Live instructor ratings and historical grade data right where you make decisions.",
  },
  {
    icon: <MapPin className="h-8 w-8" />,
    title: "Location Preference",
    description:
      "Tailor schedules to specific campuses—or remote only—instantly.",
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: "One‑Click Variants",
    description:
      "Generate multiple persona‑based schedules (Early Bird, Late & Tight, etc.) with a single tap.",
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function Home() {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(true);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleRetryConnection = () => setIsApiAvailable(true);
  const handleSearch = () => router.push("/search");
  const handlePlan = () => router.push("/plan");
  const toggleHelpModal = () => setShowHelpModal((prev) => !prev);

  // ---------------------------------------------------------------------------
  // Scroll‑based reveal logic (Framer’s useInView)
  // ---------------------------------------------------------------------------
  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-50px" });

  // Clean up body scroll lock on unmount for modal
  useEffect(() => {
    document.body.style.overflow = showHelpModal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showHelpModal]);

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-100">
      {/* ---------------------------------------------------------------------
       * 1. Hero Section
       * -------------------------------------------------------------------*/}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-24 text-center">
        {/* Subtle moving gradient blob */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-[120%]
             -z-10 select-none
             bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.35),transparent_60%)]
             backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1.5 } }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
          className="mx-auto max-w-5xl bg-gradient-to-r from-primary-green to-primary-blue bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-7xl md:text-8xl"
        >
          4yrplan
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.2 } }}
          className="mt-6 max-w-xl text-lg/relaxed text-zinc-300 md:text-xl"
        >
          Plan your entire college journey in minutes, not hours.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 1, delay: 0.4 } }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="rounded-full bg-primary-blue px-10 py-6 text-lg font-semibold shadow-lg hover:bg-primary-blue/90"
            onClick={handleSearch}
          >
            Search Courses
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full border border-primary-green/30 bg-primary-green px-10 py-6 text-lg font-semibold text-zinc-950 shadow-lg hover:bg-primary-green/90"
            onClick={handlePlan}
          >
            Build Plan
          </Button>
        </motion.div>

        {/* Hero device mock‑up */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 1.1, delay: 0.6 } }}
          className="pointer-events-none relative mt-16 w-full max-w-4xl select-none"
        >
          <Image src={heroMock} alt="4yrplan preview" className="w-full rounded-2xl shadow-2xl" priority />
        </motion.div>
      </section>

      {/* ---------------------------------------------------------------------
       * 2. API Error Banner (visible at top when not available)
       * -------------------------------------------------------------------*/}
      <AnimatePresence>
        {!isApiAvailable && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-4xl rounded-b-xl border border-red-500 bg-red-600/90 p-4 backdrop-blur-md"
          >
            <h2 className="mb-2 text-xl font-bold">API Connection Error</h2>
            <p>Unable to connect to the Course API. This is required to display course information.</p>
            <ul className="list-disc pl-5 text-sm text-red-100">
              <li>Ensure the API server is running (<code>uvicorn api.main:app --reload</code>)</li>
              <li>Check your network connection</li>
              <li>
                Verify it’s reachable at <code>/api</code>
              </li>
            </ul>
            <Button className="mt-3 bg-red-800 hover:bg-red-900" onClick={handleRetryConnection}>
              Retry Connection
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------
       * 3. Features Grid
       * -------------------------------------------------------------------*/}
      <section
        ref={featuresRef}
        className="mx-auto max-w-7xl px-6 pb-28 pt-20 md:px-10"
      >
        <motion.h2
          className="mb-12 text-center text-4xl font-bold tracking-tight sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Everything You Need to Graduate—Beautifully
        </motion.h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i}
              initial="hidden"
              animate={featuresInView ? "visible" : "hidden"}
              variants={fadeInUp}
              className="flex flex-col rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 backdrop-blur-lg"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-blue/20 text-primary-blue">
                {feat.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-zinc-100">
                {feat.title}
              </h3>
              <p className="text-zinc-400">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24 text-zinc-300 md:px-10">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mb-8 text-center text-4xl font-bold text-zinc-100 sm:text-5xl"
      >
        More than a scheduler — your academic command center
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="leading-relaxed"
      >
        4yrplan pulls live catalog data, Rate My Professor scores, and grade
        distributions straight into one interface. Dial in the exact <strong>term</strong>,
        set <strong>minute‑level availability</strong>, pick preferred <strong>campuses</strong>, and
        generate up to <strong>four persona‑driven schedules</strong>&nbsp;—
        all without spreadsheets or Patriot Web gymnastics.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="mt-6 leading-relaxed"
      >
        Need total control? Manually drag courses into a semester plan, lock
        down break times, or exclude a professor with one click. The degree‑audit
        tracker updates in real‑time so you always know what’s left to graduate.
        Coming soon: a public API so you can plug the same data into your own
        side projects.
      </motion.p>
    </section>

      {/* ---------------------------------------------------------------------
       * 4. Story + CTA Section
       * -------------------------------------------------------------------*/}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-primary-blue/10 via-zinc-900 to-zinc-950 py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/grid.svg')] opacity-[0.03]" />
        <div className="mx-auto max-w-4xl px-6 text-center md:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Born from Student Frustration
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-lg text-zinc-300"
          >
            We were tired of juggling spreadsheets, degree audits, and clunky registrar tools. 4yrplan distills everything into one elegant interface—so you can focus on learning, not logistics.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <Button
              size="lg"
              className="rounded-full bg-primary-green px-10 py-6 text-lg font-semibold text-zinc-950 hover:bg-primary-green/90"
              onClick={handlePlan}
            >
              Start Planning
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-primary-blue/30 px-10 py-6 text-lg font-semibold hover:bg-primary-blue/10"
              onClick={handleSearch}
            >
              Explore Courses
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 5. Sticky Help Button & Modal
       * -------------------------------------------------------------------*/}
      <button
        onClick={toggleHelpModal}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-primary-blue/40 bg-zinc-900/70 px-4 py-2 text-sm font-medium text-primary-blue backdrop-blur-md hover:bg-zinc-900/90"
      >
        <HelpCircle className="h-4 w-4" /> How to use 4yrplan
      </button>

      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={toggleHelpModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="relative max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-zinc-950 p-8 text-left shadow-2xl"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-primary-green">
                <HelpCircle className="h-6 w-6" /> How to Use 4yrplan
              </h2>
              <p className="mb-4 text-zinc-300">
                4yrplan helps you blueprint your academic journey with ease. Here’s what you can do:
              </p>
              <ol className="space-y-3 text-zinc-400">
                <li>
                  <span className="font-medium text-primary-blue">Search for Courses —</span> View prerequisites, professor ratings, and grade
                  distributions before adding them to your plan.
                </li>
                <li>
                  <span className="font-medium text-primary-blue">Drag‑and‑Drop Planner —</span> Craft multi‑semester plans; the degree
                  audit updates live as you go.
                </li>
                <li>
                  <span className="font-medium text-primary-blue">Persona‑based Schedules —</span> Generate optimized variants in one click
                  to suit your lifestyle.
                </li>
              </ol>
              <div className="mt-8 rounded-xl bg-primary-blue/10 p-4 text-sm text-primary-blue">
                For feedback or support, email us at
                <Link href="mailto:hi@4yrplan.com" className="ml-1 underline">
                  hi@4yrplan.com
                </Link>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4 rounded-full bg-zinc-800 hover:bg-zinc-700"
                onClick={toggleHelpModal}
              >
                ✕
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
