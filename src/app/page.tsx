import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TypewriterText } from "@/components/TypewriterText";

export default function Home() {
  return (
    <main className="landing-shell relative min-h-screen overflow-hidden text-white">
      <div className="landing-aurora" aria-hidden="true" />
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-scan" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-10 border-b border-white/10 bg-white/7 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-md border border-white/14 bg-white/90 shadow-panel">
              <img src="/kitsune-logo.png" alt="KITSUNE logo" className="h-9 w-9 object-contain" />
            </span>
            <span className="text-lg font-semibold tracking-normal">Kitsune AI</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 grid min-h-screen place-items-center px-5 pt-[72px] text-center">
        <div className="max-w-5xl">
          <h1 className="landing-hero-title mx-auto max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            <TypewriterText brandText="KITSUNE AI" sloganText="Scale smarter. Expand with AI confidence." />
          </h1>
          <Link href="/workspace/input" className="landing-cta mt-8 inline-flex h-[52px] items-center gap-3 rounded-md px-6 text-sm font-semibold text-ink">
            Try Now
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
