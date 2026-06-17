import Link from "next/link";
import { ArrowRight, BarChart3, Building2, CircleDollarSign, MapPin, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="landing-shell min-h-screen overflow-hidden text-white">
      <div className="landing-aurora" aria-hidden="true" />
      <div className="landing-grid" aria-hidden="true" />
      <div className="landing-scan" aria-hidden="true" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-2 text-xs font-semibold uppercase text-white/72 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-cyan-200" aria-hidden="true" />
              AI Expansion Intelligence
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
              BranchWise AI
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              A premium AI business analyst platform for small restaurants and retailers that need consultant-level diagnosis, growth strategy, and expansion planning without a full data team.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/workspace/input" className="landing-cta inline-flex h-[52px] items-center gap-3 rounded-md px-6 text-sm font-semibold text-ink">
                Try Now
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className="rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm text-white/64">
                Built for 3-day pitch demos
              </span>
            </div>
          </div>

          <div className="relative min-h-[520px]">
            <div className="orbit-ring orbit-ring-one" aria-hidden="true" />
            <div className="orbit-ring orbit-ring-two" aria-hidden="true" />
            <div className="data-core">
              <div className="data-core-inner">
                <CircleDollarSign className="h-11 w-11 text-cyan-100" aria-hidden="true" />
                <p className="mt-4 text-sm font-semibold uppercase text-white/54">Expansion Score</p>
                <p className="mt-1 text-6xl font-semibold">87</p>
              </div>
            </div>
            <div className="metric-float metric-float-a glass-mini">
              <p className="text-xs uppercase text-white/48">Revenue signal</p>
              <p className="mt-1 text-2xl font-semibold">+14.2%</p>
            </div>
            <div className="metric-float metric-float-b glass-mini">
              <p className="text-xs uppercase text-white/48">Cost leakage</p>
              <p className="mt-1 text-2xl font-semibold">7.8%</p>
            </div>
            <div className="metric-float metric-float-c glass-mini">
              <p className="text-xs uppercase text-white/48">Best zone</p>
              <p className="mt-1 text-2xl font-semibold">Kwun Tong</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-6xl gap-5 px-5 pb-16 md:grid-cols-3">
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
          <article key={item.title} className="glass-card rounded-lg p-6">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-white/12 text-cyan-100 ring-1 ring-white/12">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
