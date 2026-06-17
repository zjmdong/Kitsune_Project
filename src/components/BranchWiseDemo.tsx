"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  LineChart,
  Loader2,
  MapPin,
  Megaphone,
  Palette,
  RefreshCw,
  Sparkles,
  Store,
  Upload,
  WandSparkles
} from "lucide-react";
import { analyzeBusiness, buildCsvTemplate, calculateReadiness, rankLocations } from "@/lib/analysis";
import { parseSalesCsv } from "@/lib/csv";
import { createMockConsultantReport } from "@/lib/report";
import { createSampleSalesRecords, dataSourceLinks, districtMetrics, sampleProfile } from "@/lib/sample-data";
import type { BusinessProfile, ConsultantReport, LocationRecommendation, SalesRecord } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

const sampleRecords = createSampleSalesRecords();
const chartColors = ["#153f39", "#b65345", "#c59a45", "#238276", "#6b6f5f", "#9b5845"];

type ReportTab = "Diagnosis" | "Actions" | "Marketing" | "Design";

function panelClass(extra = "") {
  return `min-w-0 rounded-lg border border-ink/10 bg-white/92 shadow-panel ${extra}`;
}

function inputClass() {
  return "h-10 w-full rounded-md border border-ink/12 bg-white px-3 text-sm text-ink shadow-sm transition focus:border-clay";
}

function labelClass() {
  return "mb-1 block text-xs font-semibold uppercase text-ink/55";
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "fern"
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof BadgeDollarSign;
  tone?: "fern" | "clay" | "brass" | "mint";
}) {
  const toneClass = {
    fern: "bg-fern text-white",
    clay: "bg-clay text-white",
    brass: "bg-brass text-ink",
    mint: "bg-mint text-fern"
  }[tone];

  return (
    <div className="min-w-0 rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-ink/55">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${toneClass}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-ink/64">{detail}</p>
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange
}: {
  label: string;
  value: string | number;
  type?: "text" | "number";
  onChange: (value: string | number) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      <input
        className={inputClass()}
        type={type}
        value={value}
        onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      <select className={inputClass()} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgressBar({ value, max = 100, color = "#153f39" }: { value: number; max?: number; color?: string }) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
  return (
    <div className="h-2 w-full rounded-full bg-ink/8">
      <div className="h-2 rounded-full" style={{ width, backgroundColor: color }} />
    </div>
  );
}

function RecommendationRow({
  item,
  index,
  active
}: {
  item: LocationRecommendation;
  index: number;
  active: boolean;
}) {
  return (
    <div
      className={`grid min-w-0 grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-[44px_1fr_150px] ${
        active ? "border-fern bg-mint/55" : "border-ink/10 bg-white"
      }`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-md bg-ink text-sm font-semibold text-white">
        {index + 1}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-ink">{item.district}</h3>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-fern ring-1 ring-fern/20">
            {item.score}/100 fit
          </span>
        </div>
        <p className="mt-1 text-sm leading-5 text-ink/66">{item.fit}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.reasons.map((reason) => (
            <span key={reason} className="rounded-full bg-white px-2.5 py-1 text-xs text-ink/68 ring-1 ring-ink/10">
              {reason}
            </span>
          ))}
        </div>
        {item.risks.length > 0 ? (
          <p className="mt-3 text-sm text-clay">Watch: {item.risks.join(", ")}</p>
        ) : (
          <p className="mt-3 text-sm text-fern">Balanced risk profile for a second-store pilot.</p>
        )}
      </div>
      <div className="rounded-md bg-white p-3 ring-1 ring-ink/10">
        <p className="text-xs font-semibold uppercase text-ink/50">Rent estimate</p>
        <p className="mt-1 text-lg font-semibold text-ink">{formatCurrency(item.estimatedMonthlyRent)}</p>
        <p className="mt-3 text-xs font-semibold uppercase text-ink/50">Payback</p>
        <p className="mt-1 text-lg font-semibold text-ink">
          {item.paybackMonths >= 99 ? "Needs review" : `${item.paybackMonths} mo`}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/20 bg-white p-6 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-ink/62">{body}</p>
    </div>
  );
}

export function BranchWiseDemo() {
  const [profile, setProfile] = useState<BusinessProfile>(sampleProfile);
  const [records, setRecords] = useState<SalesRecord[]>(sampleRecords);
  const [dataMode, setDataMode] = useState<"sample" | "uploaded">("sample");
  const [report, setReport] = useState<ConsultantReport | null>(null);
  const [reportTab, setReportTab] = useState<ReportTab>("Diagnosis");
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("Sample dataset loaded");

  const analysis = useMemo(() => analyzeBusiness(records, profile), [records, profile]);
  const readiness = useMemo(() => calculateReadiness(analysis, profile), [analysis, profile]);
  const locations = useMemo(() => rankLocations(districtMetrics, profile, analysis), [analysis, profile]);
  const currentReport = useMemo(
    () => report ?? createMockConsultantReport(profile, analysis, locations),
    [analysis, locations, profile, report]
  );

  useEffect(() => {
    setReport(null);
  }, [analysis, locations, profile]);

  function updateProfile<K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) {
    setProfile((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    const text = await file.text();
    const parsed = parseSalesCsv(text);

    if (parsed.length === 0) {
      setUploadMessage("CSV loaded, but no valid sales rows were found");
      return;
    }

    setRecords(parsed);
    setDataMode("uploaded");
    setUploadMessage(`${formatNumber(parsed.length)} sales rows loaded from ${file.name}`);
  }

  function loadSample() {
    setRecords(sampleRecords);
    setProfile(sampleProfile);
    setDataMode("sample");
    setUploadMessage("Sample dataset loaded");
  }

  function downloadTemplate() {
    const blob = new Blob([buildCsvTemplate(sampleRecords)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "branchwise-sample-sales.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function generateReport() {
    setIsReportLoading(true);
    try {
      const response = await fetch("/api/consultant-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile,
          analysis,
          locations
        })
      });

      if (!response.ok) {
        throw new Error("Report API failed");
      }

      const nextReport = (await response.json()) as ConsultantReport;
      setReport(nextReport);
      setReportTab("Diagnosis");
    } catch {
      setReport(createMockConsultantReport(profile, analysis, locations));
    } finally {
      setIsReportLoading(false);
    }
  }

  const riskTone =
    readiness.riskLevel === "Low"
      ? "bg-mint text-fern"
      : readiness.riskLevel === "Medium"
        ? "bg-brass/18 text-ink"
        : "bg-clay/12 text-clay";

  const topLocation = locations[0];
  const chartSeries = analysis.dailySeries.map((point) => ({
    ...point,
    dateLabel: point.date.slice(5)
  }));
  const reportTabs: ReportTab[] = ["Diagnosis", "Actions", "Marketing", "Design"];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-pearl/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-fern text-white">
              <Store className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-6 text-ink">BranchWise AI</p>
              <p className="text-sm text-ink/58">Expansion desk for Hong Kong SME restaurants</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10">
              {dataMode === "sample" ? "Sample business" : "Uploaded CSV"}
            </span>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/12 bg-white px-3 text-sm font-semibold text-ink transition hover:border-fern"
              onClick={loadSample}
              type="button"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-md bg-fern px-4 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
              onClick={generateReport}
              disabled={isReportLoading}
              type="button"
            >
              {isReportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
              )}
              Generate AI Report
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1480px] grid-cols-1 gap-5 px-4 py-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className={panelClass("p-4")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-ink/55">Owner intake</p>
                <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink">{profile.businessName}</h1>
              </div>
              <Building2 className="h-6 w-6 text-clay" aria-hidden="true" />
            </div>

            <div className="mt-5 grid gap-3">
              <Field
                label="Business name"
                value={profile.businessName}
                onChange={(value) => updateProfile("businessName", String(value))}
              />
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Positioning"
                  value={profile.positioning}
                  options={["Value", "Mid-market", "Premium"]}
                  onChange={(value) => updateProfile("positioning", value as BusinessProfile["positioning"])}
                />
                <Field
                  label="District"
                  value={profile.currentDistrict}
                  onChange={(value) => updateProfile("currentDistrict", String(value))}
                />
              </div>
              <Field
                label="Concept"
                value={profile.cuisineOrProduct}
                onChange={(value) => updateProfile("cuisineOrProduct", String(value))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Monthly rent"
                  type="number"
                  value={profile.monthlyRent}
                  onChange={(value) => updateProfile("monthlyRent", Number(value))}
                />
                <Field
                  label="Staff"
                  type="number"
                  value={profile.staffCount}
                  onChange={(value) => updateProfile("staffCount", Number(value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Weekly orders"
                  type="number"
                  value={profile.weeklyTransactions}
                  onChange={(value) => updateProfile("weeklyTransactions", Number(value))}
                />
                <Field
                  label="Avg ticket"
                  type="number"
                  value={profile.averageTicket}
                  onChange={(value) => updateProfile("averageTicket", Number(value))}
                />
              </div>
              <Field
                label="Expansion budget"
                type="number"
                value={profile.expansionBudget}
                onChange={(value) => updateProfile("expansionBudget", Number(value))}
              />
              <label className="block">
                <span className={labelClass()}>Owner goal</span>
                <textarea
                  className="min-h-24 w-full rounded-md border border-ink/12 bg-white px-3 py-2 text-sm text-ink shadow-sm transition focus:border-clay"
                  value={profile.ownerGoal}
                  onChange={(event) => updateProfile("ownerGoal", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className={panelClass("p-4")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-ink/55">Sales input</p>
                <p className="mt-1 text-sm text-ink/64">{uploadMessage}</p>
              </div>
              <FileSpreadsheet className="h-5 w-5 text-fern" aria-hidden="true" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-fern">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload
                <input
                  className="sr-only"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => {
                    void handleUpload(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-ink/12 bg-white px-3 text-sm font-semibold text-ink transition hover:border-fern"
                onClick={downloadTemplate}
                type="button"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                CSV
              </button>
            </div>
            <div className="mt-4 rounded-md bg-paper p-3 text-sm text-ink/66">
              <p className="font-semibold text-ink">{formatNumber(records.length)} rows analyzed</p>
              <p className="mt-1">Columns: date, hour, product, category, units, revenue, cost, channel.</p>
            </div>
          </section>

          <section className={panelClass("p-4")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-ink/55">Expansion readiness</p>
                <p className="mt-2 text-4xl font-semibold text-ink">{readiness.score}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${riskTone}`}>
                {readiness.riskLevel} risk
              </span>
            </div>
            <p className="mt-3 text-sm leading-5 text-ink/66">{readiness.verdict}</p>
            <div className="mt-4 space-y-3">
              {readiness.factors.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="text-ink/55">
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <ProgressBar value={item.score} max={item.max} color={item.score / item.max > 0.7 ? "#153f39" : "#b65345"} />
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Monthly revenue"
              value={formatCurrency(analysis.estimatedMonthlyRevenue, { compact: true })}
              detail={`${formatPercent(analysis.revenueTrend)} recent trend from loaded sales.`}
              icon={LineChart}
              tone="fern"
            />
            <MetricCard
              label="Gross margin"
              value={formatPercent(analysis.grossMargin)}
              detail={`${formatCurrency(analysis.grossProfit, { compact: true })} gross profit in the dataset.`}
              icon={BadgeDollarSign}
              tone="brass"
            />
            <MetricCard
              label="Operating profit"
              value={formatCurrency(analysis.estimatedMonthlyProfit, { compact: true })}
              detail="Estimated after rent, payroll, COGS, and overhead."
              icon={BarChart3}
              tone="clay"
            />
            <MetricCard
              label="Best district"
              value={topLocation?.district ?? "Pending"}
              detail={topLocation ? `${topLocation.score}/100 location fit score.` : "Add sales records to rank districts."}
              icon={MapPin}
              tone="mint"
            />
          </div>

          <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.8fr]">
            <div className={panelClass("p-4")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink/55">Business analytics</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">Revenue and cost trend</h2>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold text-ink/66">
                  Peak {analysis.peakHour}:00
                </span>
              </div>
              <div className="mt-4 h-[320px]">
                {chartSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSeries}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#153f39" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#153f39" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#e6e2d8" vertical={false} />
                      <XAxis dataKey="dateLabel" minTickGap={28} tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatCurrency(Number(value), { compact: true })} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        labelFormatter={(label) => `Date ${label}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#153f39"
                        fill="url(#revenueFill)"
                        strokeWidth={2}
                        name="Revenue"
                      />
                      <Area type="monotone" dataKey="cost" stroke="#b65345" fill="transparent" strokeWidth={2} name="Cost" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No trend data" body="Load the sample dataset or upload a CSV." />
                )}
              </div>
            </div>

            <div className={panelClass("p-4")}>
              <p className="text-xs font-semibold uppercase text-ink/55">Product mix</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Top revenue items</h2>
              <div className="mt-4 h-[320px]">
                {analysis.bestProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.bestProducts} layout="vertical" margin={{ left: 16, right: 12 }}>
                      <CartesianGrid stroke="#e6e2d8" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={118}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => String(value).slice(0, 18)}
                      />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#153f39" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No product data" body="Product level rows are required for menu ranking." />
                )}
              </div>
            </div>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className={panelClass("p-4")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink/55">Channel behavior</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">Demand split</h2>
                </div>
                <ClipboardList className="h-5 w-5 text-clay" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[0.95fr_1fr]">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analysis.channelMix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                        {analysis.channelMix.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {analysis.channelMix.map((item, index) => (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink">{item.name}</span>
                        <span className="text-ink/56">{formatPercent(item.share ?? 0)}</span>
                      </div>
                      <ProgressBar value={item.share ?? 0} max={1} color={chartColors[index % chartColors.length]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={panelClass("p-4")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink/55">Operating risks</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">Analyst alerts</h2>
                </div>
                <CheckCircle2 className="h-5 w-5 text-fern" aria-hidden="true" />
              </div>
              <div className="mt-4 grid gap-3">
                {(analysis.operatingRisks.length > 0
                  ? analysis.operatingRisks
                  : ["Core store is healthy enough for controlled expansion planning."]
                ).map((risk) => (
                  <div key={risk} className="rounded-md border border-ink/10 bg-paper p-3 text-sm leading-5 text-ink/72">
                    {risk}
                  </div>
                ))}
                <div className="rounded-md border border-fern/16 bg-mint/55 p-3 text-sm leading-5 text-fern">
                  Recommended next checkpoint: validate rent ceiling, manager bench, and opening cash runway before lease signing.
                </div>
              </div>
            </div>
          </section>

          <section className={panelClass("p-4")} id="locations">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-ink/55">Expansion and location advisor</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">Hong Kong second-store shortlist</h2>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold text-ink/66">
                {locations.length} districts scored
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {locations.slice(0, 4).map((item, index) => (
                <RecommendationRow key={item.district} item={item} index={index} active={index === 0} />
              ))}
            </div>
          </section>

          <section className={panelClass("overflow-hidden")} id="report">
            <div className="border-b border-ink/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink/55">AI consultant report</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">
                    {currentReport.mode === "live" ? "Live AI output" : "Deterministic demo output"}
                  </h2>
                </div>
                <div className="inline-flex rounded-md bg-paper p-1">
                  {reportTabs.map((tab) => (
                    <button
                      key={tab}
                    className={`h-9 rounded px-3 text-sm font-semibold transition ${
                        reportTab === tab ? "bg-white text-ink shadow-sm" : "text-ink/58 hover:text-ink"
                      }`}
                      onClick={() => setReportTab(tab)}
                      type="button"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4">
              {reportTab === "Diagnosis" ? (
                <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <div>
                    <p className="text-base leading-7 text-ink/76">{currentReport.diagnosis}</p>
                    <div className="mt-5 grid gap-3">
                      {currentReport.keyInsights.map((insight) => (
                        <div key={insight} className="flex gap-3 rounded-md bg-paper p-3">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-clay" aria-hidden="true" />
                          <p className="text-sm leading-5 text-ink/74">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-ink p-4 text-white">
                    <p className="text-sm font-semibold uppercase text-white/62">Expected impact</p>
                    <div className="mt-4 space-y-3">
                      {currentReport.expectedImpact.map((impact) => (
                        <div key={impact} className="flex gap-3 text-sm leading-5 text-white/82">
                          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-brass" aria-hidden="true" />
                          {impact}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {reportTab === "Actions" ? (
                <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Recommendations</h3>
                    <div className="mt-3 space-y-3">
                      {currentReport.recommendations.map((item) => (
                        <div key={item} className="rounded-md border border-ink/10 bg-white p-3 text-sm leading-5 text-ink/72">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">First 90 days</h3>
                    <div className="mt-3 space-y-3">
                      {currentReport.first90Days.map((item) => (
                        <div key={item} className="rounded-md border border-ink/10 bg-paper p-3 text-sm leading-5 text-ink/72">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {reportTab === "Marketing" ? (
                <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[1fr_0.9fr]">
                  <div>
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-clay" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-ink">Positioning</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/74">{currentReport.marketingPlan.positioning}</p>
                    <h3 className="mt-5 text-lg font-semibold text-ink">Campaigns</h3>
                    <div className="mt-3 space-y-3">
                      {currentReport.marketingPlan.campaigns.map((campaign) => (
                        <div key={campaign} className="rounded-md bg-paper p-3 text-sm leading-5 text-ink/72">
                          {campaign}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-ink">Social posts</h3>
                      <div className="mt-3 space-y-3">
                        {currentReport.marketingPlan.socialPosts.map((post) => (
                          <div key={post} className="rounded-md border border-ink/10 bg-white p-3 text-sm leading-5 text-ink/72">
                            {post}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md bg-mint p-3 text-sm leading-5 text-fern">
                      {currentReport.marketingPlan.loyaltyProgram}
                    </div>
                  </div>
                </div>
              ) : null}

              {reportTab === "Design" ? (
                <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="overflow-hidden rounded-lg border border-ink/10 bg-paper">
                    <img
                      src="/branchwise-moodboard.png"
                      alt="AI generated Thai restaurant interior moodboard"
                      className="h-full min-h-[320px] w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-clay" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-ink">Brand and interior brief</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-ink/74">{currentReport.designBrief.interiorStyle}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {currentReport.designBrief.palette.map((color) => (
                        <div key={color.hex} className="rounded-md border border-ink/10 bg-white p-2">
                          <div className="h-12 rounded" style={{ backgroundColor: color.hex }} />
                          <p className="mt-2 text-xs font-semibold text-ink">{color.name}</p>
                          <p className="text-xs text-ink/50">{color.hex}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 space-y-3">
                      {currentReport.designBrief.storefrontNotes.map((note) => (
                        <div key={note} className="rounded-md bg-paper p-3 text-sm leading-5 text-ink/72">
                          {note}
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 rounded-md bg-ink p-3 text-sm leading-5 text-white/82">
                      Prompt: {currentReport.designBrief.moodboardPrompt}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className={panelClass("p-4")}>
              <p className="text-xs font-semibold uppercase text-ink/55">Marketing calendar</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Launch sequence</h2>
              <div className="mt-4 grid gap-3">
                {currentReport.marketingPlan.seasonalCalendar.map((item) => (
                  <div key={item} className="rounded-md border border-ink/10 bg-white p-3 text-sm leading-5 text-ink/72">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className={panelClass("p-4")}>
              <p className="text-xs font-semibold uppercase text-ink/55">Data references</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Hong Kong public data anchors</h2>
              <div className="mt-4 space-y-3">
                {dataSourceLinks.map((source) => (
                  <a
                    key={source.url}
                    className="flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-3 text-sm font-semibold text-ink transition hover:border-fern"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.label}
                    <ArrowUpRight className="h-4 w-4 text-clay" aria-hidden="true" />
                  </a>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-ink/52">{currentReport.disclaimer}</p>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
