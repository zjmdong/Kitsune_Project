import Link from "next/link";
import { ArrowRight, Network } from "lucide-react";

export default function Home() {
  return (
    <main className="landing-shell relative min-h-screen overflow-hidden text-white">
      <div className="landing-aurora" aria-hidden="true" />
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-scan" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-10 border-b border-white/10 bg-white/7 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md border border-white/14 bg-white/12 shadow-panel">
              <Network className="h-5 w-5 text-orange-100" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-normal">Kitsune</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 grid min-h-screen place-items-center px-5 pt-[72px] text-center">
        <div className="glass-panel max-w-4xl px-6 py-9 sm:px-10 sm:py-12">
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-6xl">
            Scale smarter. Expand with AI confidence.
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
