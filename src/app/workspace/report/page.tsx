"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ArrowLeft, Download, FileText, MapPin, Megaphone, Palette, TrendingUp } from "lucide-react";
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

function BulletList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <p key={item} className="rounded-md bg-paper px-3 py-2 text-sm leading-5 text-ink/72">
          {item}
        </p>
      ))}
    </div>
  );
}

function addSection(doc: jsPDF, title: string, items: string[], yStart: number) {
  let y = yStart;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  items.forEach((item) => {
    const lines = doc.splitTextToSize(`- ${item}`, 180);
    if (y + lines.length * 5 > 282) {
      doc.addPage();
      y = 18;
    }
    doc.text(lines, 16, y);
    y += lines.length * 5 + 2;
  });
  return y + 4;
}

export default function ReportPage() {
  const [report, setReport] = useState<FinalConsultantReport | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(reportStorageKey);
    if (raw) {
      setReport(JSON.parse(raw) as FinalConsultantReport);
    }
  }, []);

  const dailyChart = useMemo(() => {
    return report?.charts.dailySeries.slice(-45).map((point) => ({ ...point, label: point.date.slice(5) })) ?? [];
  }, [report]);

  function exportPdf() {
    if (!report) return;
    const doc = new jsPDF();
    let y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BranchWise AI Consultant Report", 14, y);
    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()} | BranchWise AI output`, 14, y);
    y += 8;
    y = addSection(doc, "Executive Summary", [report.executiveSummary, report.inputSummary], y);
    y = addSection(doc, "Key Insights", report.keyInsights, y);
    y = addSection(doc, "Problem Diagnosis", report.problemDiagnosis, y);
    y = addSection(doc, "Quick Wins", report.recommendations.quickWins, y);
    y = addSection(doc, "Operational Improvements", report.recommendations.operationalImprovements, y);
    y = addSection(doc, "Strategic Moves", report.recommendations.strategicMoves, y);
    y = addSection(doc, "Marketing Strategy", [report.marketingStrategy.positioning, ...report.marketingStrategy.campaigns, report.marketingStrategy.loyaltyProgram], y);
    y = addSection(doc, "Expansion Analysis", [
      `Expansion score: ${report.expansionAnalysis.expansionReadinessScore}/100`,
      `Risk level: ${report.expansionAnalysis.riskLevel}`,
      report.expansionAnalysis.breakEvenEstimation,
      ...report.expansionAnalysis.recommendedZones.map((zone) => `${zone.district}: ${zone.score}/100 fit, rent ${formatCurrency(zone.estimatedMonthlyRent)}`)
    ], y);
    y = addSection(doc, "Action Roadmap", [
      `0-7 days: ${report.actionPlanRoadmap.now.join("; ")}`,
      `7-30 days: ${report.actionPlanRoadmap.next30Days.join("; ")}`,
      `1-3 months: ${report.actionPlanRoadmap.next3Months.join("; ")}`,
      `3-12 months: ${report.actionPlanRoadmap.next12Months.join("; ")}`
    ], y);
    doc.save("branchwise-ai-report.pdf");
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
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 rounded-lg border border-ink/10 bg-white p-5 shadow-panel lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-clay">Step 3 of 3</p>
            <h1 className="mt-1 text-3xl font-semibold">Final AI Consultant Report</h1>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              BranchWise AI output · Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/workspace/input" className="inline-flex h-11 items-center gap-2 rounded-md border border-ink/12 bg-white px-4 text-sm font-semibold text-ink hover:border-fern">
              <ArrowLeft className="h-4 w-4" />
              New analysis
            </Link>
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
          {[
            ["Total revenue", formatCurrency(report.financialKpis.totalRevenue, { compact: true })],
            ["Gross margin", formatPercent(report.financialKpis.grossMargin)],
            ["Net profit", formatCurrency(report.financialKpis.netProfit, { compact: true })],
            ["Cost ratio", formatPercent(report.financialKpis.costRatio)]
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </Card>
          ))}
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
                  <Area dataKey="revenue" stroke="#153f39" fill="#d8eadf" strokeWidth={2} name="Revenue" />
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
                  <Bar dataKey="value" fill="#153f39" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Key insights</h2>
            <div className="mt-4">
              <BulletList items={report.keyInsights} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Problem diagnosis</h2>
            <div className="mt-4">
              <BulletList items={report.problemDiagnosis} />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold">Trend and bottlenecks</h2>
            <p className="mt-3 rounded-md bg-mint p-3 text-sm leading-5 text-fern">{report.consultingAnalysis.trendAnalysis}</p>
            <div className="mt-3">
              <BulletList items={report.consultingAnalysis.bottleneckAnalysis} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Profit leakage and benchmarking</h2>
            <div className="mt-3">
              <BulletList items={[...report.consultingAnalysis.profitLeakageAnalysis, ...report.consultingAnalysis.benchmarking]} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Scenario simulation</h2>
            <div className="mt-3">
              <BulletList items={report.consultingAnalysis.scenarioSimulation} />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <Card>
            <h2 className="text-xl font-semibold">Quick wins</h2>
            <div className="mt-4">
              <BulletList items={report.recommendations.quickWins} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Operational improvements</h2>
            <div className="mt-4">
              <BulletList items={report.recommendations.operationalImprovements} />
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Strategic moves</h2>
            <div className="mt-4">
              <BulletList items={report.recommendations.strategicMoves} />
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
              <BulletList items={report.marketingStrategy.campaigns} />
              <BulletList items={report.marketingStrategy.socialPosts} />
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
                    Rent {formatCurrency(zone.estimatedMonthlyRent)} · Payback {zone.paybackMonths} months
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
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Expected revenue increase: {formatPercent(report.financialImpactSimulation.expectedRevenueIncrease)}</p>
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Expected cost reduction: {formatPercent(report.financialImpactSimulation.expectedCostReduction)}</p>
              <p className="rounded-md bg-paper p-3 text-sm text-ink/70">Expected profit increase: {formatPercent(report.financialImpactSimulation.expectedProfitIncrease)}</p>
              <p className="rounded-md bg-mint p-3 text-sm leading-5 text-fern">{report.financialImpactSimulation.roiEstimation}</p>
            </div>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Action plan roadmap</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <BulletList items={report.actionPlanRoadmap.now.map((item) => `0-7 days: ${item}`)} />
              <BulletList items={report.actionPlanRoadmap.next30Days.map((item) => `7-30 days: ${item}`)} />
              <BulletList items={report.actionPlanRoadmap.next3Months.map((item) => `1-3 months: ${item}`)} />
              <BulletList items={report.actionPlanRoadmap.next12Months.map((item) => `3-12 months: ${item}`)} />
            </div>
          </Card>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="overflow-hidden p-0">
            <img src="/branchwise-moodboard.png" alt="AI generated restaurant moodboard" className="h-full min-h-[330px] w-full object-cover" />
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

        <p className="mt-5 text-xs leading-5 text-ink/50">{report.disclaimer}</p>
      </div>
    </main>
  );
}
