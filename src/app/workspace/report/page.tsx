"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AlertTriangle, ArrowLeft, BellRing, CheckCircle2, Clock3, CreditCard, Download, FileText, Gauge, Lightbulb, MapPin, Megaphone, Palette, PieChart as PieChartIcon, Rocket, Target, TrendingUp, Users, X } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { reportStorageKey } from "@/lib/workflow";
import type { FinalConsultantReport } from "@/lib/types";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-ink/10 bg-white p-5 shadow-panel ${className}`}>{children}</section>;
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{Math.round(value)}</p>
      <div className="mt-3 h-2 rounded-full bg-ink/10">
        <div className="h-2 rounded-full bg-fern" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

const mixColors = ["#2563eb", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0891b2", "#f59e0b"];
type Tone = "orange" | "green" | "red" | "amber" | "blue" | "purple";

const toneStyles: Record<Tone, string> = {
  orange: "border-clay/35 bg-clay/10 text-clay",
  green: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
  red: "border-red-500/35 bg-red-50 text-red-700",
  amber: "border-amber-500/40 bg-amber-50 text-amber-700",
  blue: "border-blue-500/35 bg-blue-50 text-blue-700",
  purple: "border-violet-500/35 bg-violet-50 text-violet-700"
};

function HighlightCard({
  label,
  value,
  icon: Icon,
  tone = "green"
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-lg border-2 p-4 ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-ink/58">{label}</p>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function riskTone(riskLevel: string): Tone {
  if (riskLevel === "High") return "red";
  if (riskLevel === "Medium") return "amber";
  return "green";
}

function profitTone(value: number): Tone {
  if (value >= 0.12) return "green";
  if (value >= 0.06) return "blue";
  return "amber";
}

function costTone(value: number): Tone {
  if (value >= 0.78) return "red";
  if (value >= 0.68) return "amber";
  return "green";
}

function rankAnalysisItems(items: string[], section: string) {
  const priorityWords = ["risk", "rent", "margin", "profit", "cost", "leak", "declin", "payback", "staff", "waste", "conversion", "revenue"];
  return items.map((item, index) => {
    const lower = `${section} ${item}`.toLowerCase();
    const keywordHit = priorityWords.some((word) => lower.includes(word));
    return {
      item,
      important: index < 2 || keywordHit
    };
  });
}

function PriorityList({ items, section }: { items: string[]; section: string }) {
  return (
    <div className="space-y-2">
      {rankAnalysisItems(items, section).map(({ item, important }) => {
        const Icon = important ? AlertTriangle : CheckCircle2;
        return (
          <div
            key={item}
            className={`flex gap-3 rounded-md border px-3 py-2 text-sm leading-5 ${
              important ? "border-clay/25 bg-clay/10 text-ink" : "border-emerald-500/18 bg-emerald-50 text-ink/70"
            }`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${important ? "text-clay" : "text-emerald-600"}`} aria-hidden="true" />
            <div>
              <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${important ? "bg-white text-clay" : "bg-white text-emerald-700"}`}>
                {important ? "Priority" : "Supporting"}
              </span>
              <p>{item}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImpactMetric({
  label,
  value,
  caption,
  tone,
  icon: Icon
}: {
  label: string;
  value: string;
  caption: string;
  tone: Tone;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className={`rounded-lg border-2 p-4 ${toneStyles[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <Icon className="h-7 w-7" aria-hidden="true" />
        <p className="text-3xl font-semibold text-ink">{value}</p>
      </div>
      <p className="mt-3 text-sm font-semibold uppercase text-ink/56">{label}</p>
      <p className="mt-1 text-sm leading-5 text-ink/68">{caption}</p>
    </div>
  );
}

function TimelineRoadmap({ report }: { report: FinalConsultantReport }) {
  const stages = [
    { label: "0-7 days", items: report.actionPlanRoadmap.now, tone: "orange" as Tone },
    { label: "7-30 days", items: report.actionPlanRoadmap.next30Days, tone: "blue" as Tone },
    { label: "1-3 months", items: report.actionPlanRoadmap.next3Months, tone: "green" as Tone },
    { label: "3-12 months", items: report.actionPlanRoadmap.next12Months, tone: "purple" as Tone }
  ];

  return (
    <div className="relative mt-4 space-y-5 pl-6">
      <div className="absolute bottom-3 left-[11px] top-2 w-px bg-ink/12" aria-hidden="true" />
      {stages.map((stage) => (
        <div key={stage.label} className="relative">
          <div className={`absolute -left-6 top-1 grid h-6 w-6 place-items-center rounded-full border-2 bg-white ${toneStyles[stage.tone]}`}>
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="rounded-lg border border-ink/10 bg-paper p-4">
            <p className="text-sm font-semibold text-ink">{stage.label}</p>
            <div className="mt-3">
              <PriorityList items={stage.items} section={`roadmap ${stage.label}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function resolveReportImagePath(imagePath?: string) {
  if (!imagePath) return "/kitsune-moodboard.png";
  if (imagePath.startsWith("/")) return imagePath;
  const normalized = imagePath.replaceAll("\\", "/");
  if (normalized.includes("kitsune-moodboard.png")) return "/kitsune-moodboard.png";
  return imagePath;
}

export default function ReportPage() {
  const [report, setReport] = useState<FinalConsultantReport | null>(null);
  const [consultantModalOpen, setConsultantModalOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(reportStorageKey);
    if (raw) {
      setReport(JSON.parse(raw) as FinalConsultantReport);
    }
  }, []);

  const dailyChart = useMemo(() => {
    return report?.charts.dailySeries.slice(-45).map((point) => ({ ...point, label: point.date.slice(5) })) ?? [];
  }, [report]);

  const showDesignBrief = Boolean(report?.selectedGoals?.includes("Branding/interior design"));

  function exportPdf() {
    window.print();
  }

  if (!report) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-4 text-ink">
        <Card className="max-w-lg text-center">
          <FileText className="mx-auto h-9 w-9 text-clay" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">No report found</h1>
          <p className="mt-2 text-sm leading-6 text-ink/62">Start a new analysis to generate a report.</p>
          <Link href="/workspace/input" className="mt-5 inline-flex h-11 items-center rounded-md bg-fern px-5 text-sm font-semibold text-white">
            Go to input
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <>
      <main className="report-page min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-5 shadow-panel lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-clay">Step 3 of 3</p>
            <h1 className="mt-1 text-3xl font-semibold">AI Consultant Report</h1>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              Generated By KITSUNE AI | {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="no-print flex flex-wrap gap-2">
            <Link href="/workspace/input" className="inline-flex h-11 items-center gap-2 rounded-md border border-ink/12 bg-white px-4 text-sm font-semibold text-ink hover:border-fern">
              <ArrowLeft className="h-4 w-4" />
              New analysis
            </Link>
            <button
              onClick={() => setConsultantModalOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-clay/25 bg-clay/10 px-4 text-sm font-semibold text-clay hover:border-clay"
            >
              <BellRing className="h-4 w-4" />
              Notify Human Consultant
            </button>
            <button onClick={exportPdf} className="inline-flex h-11 items-center gap-2 rounded-md bg-fern px-4 text-sm font-semibold text-white hover:bg-ink">
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <p className="text-xs font-semibold uppercase text-ink/50">Executive summary</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">{report.executiveSummary}</h2>
            <p className="mt-4 text-sm leading-6 text-ink/64">{report.inputSummary}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase text-ink/50">Business health score</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ScoreCard label="Overall" value={report.businessHealthScore.overall} />
              <ScoreCard label="Revenue" value={report.businessHealthScore.revenue} />
              <ScoreCard label="Cost efficiency" value={report.businessHealthScore.costEfficiency} />
              <ScoreCard label="Growth potential" value={report.businessHealthScore.growthPotential} />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-4">
          <HighlightCard label="Total revenue" value={formatCurrency(report.financialKpis.totalRevenue, { compact: true })} icon={TrendingUp} tone="blue" />
          <HighlightCard label="Expansion risk" value={report.expansionAnalysis.riskLevel} icon={report.expansionAnalysis.riskLevel === "High" ? AlertTriangle : CheckCircle2} tone={riskTone(report.expansionAnalysis.riskLevel)} />
          <HighlightCard label="Profit uplift" value={formatPercent(report.financialImpactSimulation.expectedProfitIncrease)} icon={Rocket} tone={profitTone(report.financialImpactSimulation.expectedProfitIncrease)} />
          <HighlightCard label="Cost ratio" value={formatPercent(report.financialKpis.costRatio)} icon={Gauge} tone={costTone(report.financialKpis.costRatio)} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-fern" />
              <h2 className="text-xl font-semibold">Financial and operational KPIs</h2>
            </div>
            <div className="mt-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChart}>
                  <CartesianGrid stroke="#e6e2d8" vertical={false} />
                  <XAxis dataKey="label" minTickGap={25} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(Number(value), { compact: true })} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area dataKey="revenue" stroke="#2563eb" fill="#dbeafe" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Revenue per day: {formatCurrency(report.financialKpis.revenuePerDay)}</p>
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Labor efficiency: {formatCurrency(report.financialKpis.laborCostEfficiency)} per employee</p>
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Peak efficiency: {report.operationalKpis.peakHourEfficiency}</p>
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Table turnover: {report.operationalKpis.tableTurnoverRate.toFixed(1)}x/day</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Top product performance</h2>
            <div className="mt-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.productPerformance.topByRevenue.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="#e6e2d8" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 11 }} tickFormatter={(value) => String(value).slice(0, 17)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#16a34a" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-fern" />
              <h2 className="text-xl font-semibold">Revenue mix</h2>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report.charts.categoryMix.slice(0, 6)} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2}>
                      {report.charts.categoryMix.slice(0, 6).map((item, index) => (
                        <Cell key={item.name} fill={mixColors[index % mixColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, { compact: true })} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report.charts.channelMix.slice(0, 6)} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2}>
                      {report.charts.channelMix.slice(0, 6).map((item, index) => (
                        <Cell key={item.name} fill={mixColors[(index + 2) % mixColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value, { compact: true })} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-clay" />
              <h2 className="text-xl font-semibold">Customer analytics</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <HighlightCard label="AOV" value={formatCurrency(report.customerAnalytics.averageOrderValue)} icon={Users} />
              <HighlightCard label="Estimated CLV" value={formatCurrency(report.customerAnalytics.estimatedLifetimeValue)} icon={Target} tone="purple" />
            </div>
            <p className="mt-4 rounded-md bg-paper p-3 text-sm leading-5 text-ink/70">{report.customerAnalytics.customerFrequency}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.customerAnalytics.peakSegments.map((segment) => (
                <span key={segment} className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-fern">
                  {segment}
                </span>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-brass" />
              <h2 className="text-xl font-semibold">Key insights</h2>
            </div>
            <div className="mt-4">
              <PriorityList items={report.keyInsights} section="key insights" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-clay" />
              <h2 className="text-xl font-semibold">Problem diagnosis</h2>
            </div>
            <div className="mt-4">
              <PriorityList items={report.problemDiagnosis} section="problem diagnosis" />
            </div>
          </Card>
        </section>

        {report.visibleAnalysisLog?.length ? (
          <section className="mt-5">
            <Card className="border-2 border-fern/20 bg-mint/65">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-fern" />
                <h2 className="text-xl font-semibold">Visible analysis trail</h2>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {report.visibleAnalysisLog.map((item) => (
                  <p key={item} className="rounded-md bg-white px-3 py-2 text-sm leading-5 text-ink/72">
                    {item}
                  </p>
                ))}
              </div>
            </Card>
          </section>
        ) : null}

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold">Trend and bottlenecks</h2>
            <p className="mt-3 rounded-md bg-mint p-3 text-sm leading-5 text-fern">{report.consultingAnalysis.trendAnalysis}</p>
            <div className="mt-3">
              <PriorityList items={report.consultingAnalysis.bottleneckAnalysis} section="bottleneck analysis" />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Profit leakage and benchmarking</h2>
            <div className="mt-3">
              <PriorityList items={[...report.consultingAnalysis.profitLeakageAnalysis, ...report.consultingAnalysis.benchmarking]} section="profit leakage and benchmarking" />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Scenario simulation</h2>
            <div className="mt-3">
              <PriorityList items={report.consultingAnalysis.scenarioSimulation} section="scenario simulation" />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold">Quick wins</h2>
            <div className="mt-4">
              <PriorityList items={report.recommendations.quickWins} section="quick wins" />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Operational improvements</h2>
            <div className="mt-4">
              <PriorityList items={report.recommendations.operationalImprovements} section="operational improvements" />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Strategic moves</h2>
            <div className="mt-4">
              <PriorityList items={report.recommendations.strategicMoves} section="strategic moves" />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-clay" />
              <h2 className="text-xl font-semibold">Marketing strategy</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/68">{report.marketingStrategy.positioning}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <PriorityList items={report.marketingStrategy.campaigns} section="marketing campaigns" />
              <PriorityList items={report.marketingStrategy.socialPosts} section="social posts" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-fern" />
              <h2 className="text-xl font-semibold">Expansion analysis</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {report.expansionAnalysis.recommendedZones.map((zone) => (
                <div key={zone.district} className="rounded-md border border-ink/10 bg-paper p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{zone.district}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-fern">{zone.score}/100</span>
                  </div>
                  <p className="mt-1 text-sm text-ink/62">
                    Rent {formatCurrency(zone.estimatedMonthlyRent)} | Payback {zone.paybackMonths} months
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <h2 className="text-xl font-semibold">Financial impact simulation</h2>
            <div className="mt-4 grid gap-3">
              <ImpactMetric
                label="Revenue lift"
                value={`+${formatPercent(report.financialImpactSimulation.expectedRevenueIncrease)}`}
                caption="Projected growth from pricing, traffic, channel, and local expansion actions."
                tone="blue"
                icon={TrendingUp}
              />
              <ImpactMetric
                label="Cost reduction"
                value={`-${formatPercent(report.financialImpactSimulation.expectedCostReduction)}`}
                caption="Estimated savings from menu engineering, staffing, waste, and procurement controls."
                tone="green"
                icon={Gauge}
              />
              <ImpactMetric
                label="Profit acceleration"
                value={`+${formatPercent(report.financialImpactSimulation.expectedProfitIncrease)}`}
                caption="Combined upside after revenue and cost improvements."
                tone={profitTone(report.financialImpactSimulation.expectedProfitIncrease)}
                icon={Rocket}
              />
              <p className="rounded-md border border-emerald-500/20 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800">{report.financialImpactSimulation.roiEstimation}</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Action plan roadmap</h2>
            <TimelineRoadmap report={report} />
          </Card>
        </section>

        {showDesignBrief ? (
          <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="overflow-hidden p-0">
              <img
                src={resolveReportImagePath(report.designBrief.imagePath)}
                alt="AI generated restaurant moodboard"
                className="h-full min-h-[330px] w-full object-cover"
                onError={(event) => {
                  if (!event.currentTarget.src.endsWith("/kitsune-moodboard.png")) {
                    event.currentTarget.src = "/kitsune-moodboard.png";
                  }
                }}
              />
            </Card>
            <Card>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-clay" />
                <h2 className="text-xl font-semibold">Brand and interior design brief</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/68">{report.designBrief.interiorStyle}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {report.designBrief.palette.map((color) => (
                  <div key={color.hex} className="rounded-md border border-ink/10 bg-paper p-2">
                    <div className="h-12 rounded" style={{ backgroundColor: color.hex }} />
                    <p className="mt-2 text-xs font-semibold">{color.name}</p>
                    <p className="text-xs text-ink/50">{color.hex}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-md bg-ink p-3 text-sm leading-5 text-white/78">{report.designBrief.moodboardPrompt}</p>
            </Card>
          </section>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-ink/50">{report.disclaimer}</p>
      </div>
      </main>

      {consultantModalOpen ? (
        <div className="no-print fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 text-ink shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-clay">Additional paid service</p>
                <h2 className="mt-1 text-2xl font-semibold">Notify Human Consultant</h2>
                <p className="mt-3 text-sm leading-6 text-ink/66">
                  This is an extra paid service. KITSUNE will work with professional business consulting partners to provide a one-stop advisory service based on this AI report.
                </p>
              </div>
              <button type="button" onClick={() => setConsultantModalOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md hover:bg-paper">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-5 rounded-lg border-2 border-clay/25 bg-clay/10 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Human consultant handoff</p>
                  <p className="mt-1 text-sm text-ink/62">Includes professional review, follow-up consultation, and implementation guidance.</p>
                </div>
                <p className="text-3xl font-semibold text-ink">1500 HKD</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => undefined}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-fern px-4 text-sm font-semibold text-white hover:bg-ink"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Pay for Service
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
