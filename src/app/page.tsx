import Link from "next/link";
import { ArrowRight, BarChart3, Building2, MapPin, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-pearl text-ink">
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        <img
          src="/branchwise-moodboard.png"
          alt="Premium restaurant interior moodboard"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/68" />
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center text-white">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold ring-1 ring-white/22 backdrop-blur">
            <Sparkles className="h-4 w-4 text-brass" aria-hidden="true" />
            AI business analyst for SME restaurants and retailers
          </div>
          <h1 className="text-5xl font-semibold leading-tight sm:text-6xl lg:text-7xl">BranchWise AI</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/82">
            We turn small business owners into data-driven operators, helping them diagnose performance, optimize profit, and expand from one store to a scalable chain.
          </p>
          <div className="mt-9 flex justify-center">
            <Link
              href="/workspace/input"
              className="inline-flex h-14 items-center gap-3 rounded-md bg-brass px-7 text-base font-semibold text-ink shadow-panel transition hover:bg-white"
            >
              Try Now
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 md:grid-cols-3">
        {[
          {
            icon: BarChart3,
            title: "Analyze the core store",
            body: "Revenue, margin, product mix, customer demand, and bottlenecks in one AI-readable workflow."
          },
          {
            icon: MapPin,
            title: "Plan the next location",
            body: "Expansion readiness, recommended Hong Kong zones, rent discipline, and break-even estimation."
          },
          {
            icon: Building2,
            title: "Build the brand system",
            body: "Marketing campaigns, customer retention plans, and visual direction for a repeatable franchise concept."
          }
        ].map((item) => (
          <article key={item.title} className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-fern text-white">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-ink">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/64">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
