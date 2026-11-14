import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Github, Wrench } from "lucide-react";
import { projectRepositoryUrl, showcaseMessage } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "Maintenance | Kitsune AI",
  robots: { index: false, follow: true }
};

export default function MaintenancePage() {
  return (
    <main className="landing-shell relative min-h-screen overflow-hidden text-white">
      <div className="landing-aurora motion-reduce:animate-none" aria-hidden="true" />
      <div className="landing-grid motion-reduce:animate-none" aria-hidden="true" />
      <div className="landing-scan motion-reduce:animate-none" aria-hidden="true" />

      <header className="relative z-10 border-b border-white/10 bg-white/7 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5">
          <Link href="/" className="inline-flex items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-md border border-white/14 bg-white/90 shadow-panel">
              <img src="/kitsune-logo.png" alt="" className="h-9 w-9 object-contain" />
            </span>
            <span className="text-lg font-semibold">Kitsune AI</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-72px)] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <Wrench className="mb-6 h-9 w-9 text-orange-300" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">We&apos;re under maintenance.</h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-orange-100">{showcaseMessage}</p>
        <a
          href={projectRepositoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Github className="h-5 w-5" aria-hidden="true" />
          View project on GitHub
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <Link href="/" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-orange-100 underline-offset-4 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </section>
    </main>
  );
}
