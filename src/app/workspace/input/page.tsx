"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Check, Database, FileSpreadsheet, HelpCircle, Lock, RefreshCw, Settings2, ShieldCheck, Upload, X } from "lucide-react";
import { parseSalesCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/format";
import { createSampleTemplate, isKITSUNESampleTemplate } from "@/lib/sample-template";
import { createDefaultPayload, defaultAiConfig, goalOptions, payloadStorageKey, reportStorageKey } from "@/lib/workflow";
import type { AiConfig, AnalysisPayload, FinancialInput, GoalOption, IntakeProfile, UploadedSource } from "@/lib/types";

const agreementStorageKey = "kitsune:user-agreement-v1";

function inputClass() {
  return "h-11 w-full rounded-md border border-ink/12 bg-white px-3 text-sm text-ink shadow-sm transition focus:border-clay";
}

function labelClass() {
  return "mb-1.5 block text-xs font-semibold uppercase text-ink/55";
}

function FieldLabel({
  label,
  required,
  help
}: {
  label: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <span className={`${labelClass()} flex items-center gap-1`} title={help}>
      <span>{label}</span>
      {required ? <span className="text-clay">*</span> : null}
      {help ? <HelpCircle className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" /> : null}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-ink/10 bg-white p-5 shadow-panel ${className}`}>{children}</section>;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  help
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  type?: "text" | "number" | "password";
  placeholder?: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} help={help} />
      <input
        className={inputClass()}
        type={type}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        title={help}
        value={value ?? ""}
        onChange={(event) => {
          if (type === "number") {
            onChange(event.target.value === "" ? undefined : Number(event.target.value));
          } else {
            onChange(event.target.value);
          }
        }}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required,
  help
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  help?: string;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} help={help} />
      <select className={inputClass()} value={value} onChange={(event) => onChange(event.target.value)} required={required} aria-required={required} title={help}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function InputPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AnalysisPayload>(() => createDefaultPayload());
  const [uploadMessage, setUploadMessage] = useState("Upload sales evidence or complete the manual fields to start a real LLM analysis.");
  const [error, setError] = useState("");
  const [titleClicks, setTitleClicks] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(true);
  const [agreementChecked, setAgreementChecked] = useState(false);

  const configReady = useMemo(() => Boolean(payload.aiConfig?.baseUrl && payload.aiConfig?.model), [payload.aiConfig]);

  useEffect(() => {
    setAgreementOpen(localStorage.getItem(agreementStorageKey) !== "accepted");
  }, []);

  function updateProfile<K extends keyof IntakeProfile>(key: K, value: IntakeProfile[K]) {
    setPayload((current) => ({
      ...current,
      profile: { ...current.profile, [key]: value }
    }));
  }

  function updateFinancial<K extends keyof FinancialInput>(key: K, value: FinancialInput[K]) {
    setPayload((current) => ({
      ...current,
      financials: { ...current.financials, [key]: value }
    }));
  }

  function updateAiConfig<K extends keyof AiConfig>(key: K, value: AiConfig[K]) {
    setPayload((current) => ({
      ...current,
      aiConfig: { ...(current.aiConfig ?? defaultAiConfig), [key]: value }
    }));
  }

  function toggleGoal(goal: GoalOption) {
    setPayload((current) => {
      const hasGoal = current.profile.goals.includes(goal);
      return {
        ...current,
        profile: {
          ...current.profile,
          goals: hasGoal ? current.profile.goals.filter((item) => item !== goal) : [...current.profile.goals, goal]
        }
      };
    });
  }

  async function handleSalesUpload(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const records = parseSalesCsv(text);
    if (records.length === 0) {
      setUploadMessage("No valid sales rows found. Required columns: date, hour, product, category, units, revenue, cost, channel.");
      return;
    }
    const source: UploadedSource = {
      kind: "sales",
      name: file.name,
      rowCount: records.length,
      notes: "Uploaded sales data used for KPI calculation."
    };
    setPayload((current) => ({
      ...current,
      mode: "real",
      templateReport: undefined,
      loadingScript: undefined,
      salesRecords: records,
      uploadedSources: [source, ...current.uploadedSources.filter((item) => item.kind !== "sales")]
    }));
    setUploadMessage(`${formatNumber(records.length)} valid sales rows loaded from ${file.name}.`);
  }

  function handleSupportingUpload(kind: UploadedSource["kind"], file: File | undefined) {
    if (!file) return;
    const source: UploadedSource = {
      kind,
      name: file.name,
      notes: "Stored as supporting context for the AI analysis workflow."
    };
    setPayload((current) => ({
      ...current,
      uploadedSources: [source, ...current.uploadedSources.filter((item) => item.kind !== kind)]
    }));
  }

  function downloadCsvTemplate() {
    const blob = new Blob(["date,hour,product,category,units,revenue,cost,channel\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kitsune-sales-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadHiddenTemplate() {
    const template = createSampleTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kitsune-internal-sample-template.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleTemplateUpload(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isKITSUNESampleTemplate(parsed)) {
        setError("Template file is not a valid KITSUNE sample package.");
        return;
      }
      const templateReport = parsed.payload.templateReport
        ? {
            ...parsed.payload.templateReport,
            designBrief: {
              ...parsed.payload.templateReport.designBrief,
              imagePath:
                parsed.payload.templateReport.designBrief.imagePath ??
                parsed.payload.templateAssets?.designBriefImagePath
            }
          }
        : undefined;
      setPayload({
        ...parsed.payload,
        mode: "template",
        loadingScript: parsed.loadingScript,
        templateReport,
        aiConfig: parsed.payload.aiConfig ?? payload.aiConfig ?? defaultAiConfig
      });
      setUploadMessage(
        `${formatNumber(parsed.payload.salesRecords.length)} template sales rows and ${parsed.payload.uploadedSources.length} supporting sources loaded.`
      );
      setTemplateDialogOpen(false);
      setError("");
    } catch {
      setError("Unable to read template file. Please upload a valid JSON template.");
    }
  }

  function resetForm() {
    setPayload(createDefaultPayload());
    setUploadMessage("Upload sales evidence or complete the manual fields to start a real LLM analysis.");
    setError("");
  }

  function handleTitleClick() {
    const next = titleClicks + 1;
    setTitleClicks(next);
    if (next >= 5) {
      setTemplateDialogOpen(true);
      setTitleClicks(0);
    }
  }

  function acceptAgreement() {
    if (!agreementChecked) return;
    localStorage.setItem(agreementStorageKey, "accepted");
    setAgreementOpen(false);
  }

  function startAnalysis() {
    const missing: string[] = [];
    if (!payload.profile.businessName.trim()) missing.push("business name");
    if (!payload.profile.businessType.trim()) missing.push("business type");
    if (!payload.profile.businessSize) missing.push("business size");
    if (!payload.profile.city.trim()) missing.push("city");
    if (!payload.profile.area.trim()) missing.push("area / district");
    if (!payload.profile.employees || payload.profile.employees <= 0) missing.push("employees");
    if (!payload.profile.openingHours.trim()) missing.push("opening hours");
    if (!payload.profile.businessModel) missing.push("business model");
    if (!payload.salesRecords.length && !payload.financials.monthlyRevenue) missing.push("monthly revenue or sales CSV");
    if (!payload.salesRecords.length && !payload.financials.rentCost) missing.push("rent cost or sales/cost evidence");
    if (!payload.salesRecords.length && !payload.financials.laborCost) missing.push("labor cost or sales/cost evidence");
    if (!payload.salesRecords.length && !payload.financials.ingredientCost) missing.push("ingredient/product cost or sales/cost evidence");

    if (missing.length > 0) {
      setError(`Please complete required inputs before analysis: ${missing.join(", ")}.`);
      return;
    }
    if (payload.profile.goals.length === 0) {
      setError("Please select at least one business goal.");
      return;
    }
    if (!configReady) {
      setError("LLM endpoint and model are required. Open advanced settings to check the configuration.");
      return;
    }

    localStorage.setItem(payloadStorageKey, JSON.stringify(payload));
    localStorage.removeItem(reportStorageKey);
    router.push("/workspace/loading");
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-ink/10 bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold uppercase text-clay">Step 1 of 3</p>
          <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="select-none text-3xl font-semibold" onClick={handleTitleClick}>
                Input Your Business Info
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                Fill in business context, upload evidence files, and start a real LLM analysis.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink/50">Manual input</p>
                  <h2 className="mt-1 text-xl font-semibold">Business Profile</h2>
                </div>
                <Database className="h-5 w-5 text-fern" aria-hidden="true" />
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <TextField label="Business name" required help="Your store or brand name used in the final report." value={payload.profile.businessName} onChange={(value) => updateProfile("businessName", String(value))} />
                <SelectField label="Business type" required help="The main category the AI should benchmark against." value={payload.profile.businessType} options={["Restaurant", "Cafe", "Retail", "Bakery", "Other"]} onChange={(value) => updateProfile("businessType", value)} />
                <SelectField label="Business size" required help="Current operating scale, used for expansion-readiness scoring." value={payload.profile.businessSize} options={["Single store", "Small chain", "Chain"]} onChange={(value) => updateProfile("businessSize", value as IntakeProfile["businessSize"])} />
                <TextField label="City" required help="Primary market for local assumptions and location advice." value={payload.profile.city} onChange={(value) => updateProfile("city", String(value))} />
                <TextField label="Area / District" required help="Current store district or target operating area." value={payload.profile.area} onChange={(value) => updateProfile("area", String(value))} />
                <TextField label="Employees" required help="Total staff count; used for labor efficiency and staffing risk." type="number" value={payload.profile.employees || undefined} onChange={(value) => updateProfile("employees", Number(value ?? 0))} />
                <TextField label="Opening hours" required help="Daily operating window, for example 11:00-22:00." value={payload.profile.openingHours} onChange={(value) => updateProfile("openingHours", String(value))} />
                <SelectField label="Business model" required help="Main service model that drives capacity and margin assumptions." value={payload.profile.businessModel} options={["Dine-in", "Takeaway", "Hybrid", "Retail"]} onChange={(value) => updateProfile("businessModel", value as IntakeProfile["businessModel"])} />
                <TextField label="Seating capacity" help="Optional seat count for table turnover and capacity estimates." type="number" value={payload.profile.seatingCapacity} onChange={(value) => updateProfile("seatingCapacity", value ? Number(value) : undefined)} />
                <TextField label="Daily customer count" help="Optional average daily customer count; improves AOV and CLV estimates." type="number" value={payload.profile.dailyCustomerCount} onChange={(value) => updateProfile("dailyCustomerCount", value ? Number(value) : undefined)} />
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase text-ink/50">Manual input</p>
              <h2 className="mt-1 text-xl font-semibold">Financial, Customer, and Goal Inputs</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <TextField label="Monthly revenue" required help="Required if no sales CSV is uploaded; monthly gross sales in HKD." type="number" value={payload.financials.monthlyRevenue} onChange={(value) => updateFinancial("monthlyRevenue", value ? Number(value) : undefined)} />
                <TextField label="Rent cost" required help="Monthly rent in HKD, used for cost ratio and expansion payback." type="number" value={payload.financials.rentCost} onChange={(value) => updateFinancial("rentCost", value ? Number(value) : undefined)} />
                <TextField label="Labor cost" required help="Monthly payroll or staffing cost in HKD." type="number" value={payload.financials.laborCost} onChange={(value) => updateFinancial("laborCost", value ? Number(value) : undefined)} />
                <TextField label="Ingredient/product cost" required help="Monthly COGS in HKD; for restaurants this is food and beverage cost." type="number" value={payload.financials.ingredientCost} onChange={(value) => updateFinancial("ingredientCost", value ? Number(value) : undefined)} />
                <TextField label="Daily revenue" help="Optional average daily gross sales in HKD." type="number" value={payload.financials.dailyRevenue} onChange={(value) => updateFinancial("dailyRevenue", value ? Number(value) : undefined)} />
                <TextField label="Morning revenue" help="Optional monthly or representative morning sales in HKD." type="number" value={payload.financials.morningRevenue} onChange={(value) => updateFinancial("morningRevenue", value ? Number(value) : undefined)} />
                <TextField label="Lunch revenue" help="Optional lunch-period revenue used to find peak demand and pricing opportunities." type="number" value={payload.financials.lunchRevenue} onChange={(value) => updateFinancial("lunchRevenue", value ? Number(value) : undefined)} />
                <TextField label="Dinner revenue" help="Optional dinner-period revenue used to compare time-based demand." type="number" value={payload.financials.dinnerRevenue} onChange={(value) => updateFinancial("dinnerRevenue", value ? Number(value) : undefined)} />
                <TextField label="Utilities" help="Optional monthly utilities and overhead cost in HKD." type="number" value={payload.financials.utilitiesCost} onChange={(value) => updateFinancial("utilitiesCost", value ? Number(value) : undefined)} />
                <TextField label="Net profit" help="Optional monthly net profit if already known." type="number" value={payload.financials.netProfit} onChange={(value) => updateFinancial("netProfit", value ? Number(value) : undefined)} />
                <TextField label="Gross margin %" help="Optional owner-provided gross margin percentage." type="number" value={payload.financials.grossMargin} onChange={(value) => updateFinancial("grossMargin", value ? Number(value) : undefined)} />
                <TextField label="Waste rate %" help="Optional waste or unsold-stock percentage for profit leakage analysis." type="number" value={payload.financials.wasteRate} onChange={(value) => updateFinancial("wasteRate", value ? Number(value) : undefined)} />
                <TextField label="Peak hours" help="Optional busy time windows, for example 12:00-14:00, 19:00-21:00." value={payload.profile.peakHours} onChange={(value) => updateProfile("peakHours", String(value))} />
                <TextField label="Off-peak hours" help="Optional slow periods where promotions or staff optimization may help." value={payload.profile.offPeakHours} onChange={(value) => updateProfile("offPeakHours", String(value))} />
                <TextField label="Repeat customer rate %" help="Optional estimated repeat customer share." type="number" value={payload.profile.repeatCustomerRate} onChange={(value) => updateProfile("repeatCustomerRate", value ? Number(value) : undefined)} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextField label="Average spend per customer" help="Optional average order value in HKD." type="number" value={payload.profile.averageSpendPerCustomer} onChange={(value) => updateProfile("averageSpendPerCustomer", value ? Number(value) : undefined)} />
                <TextField label="Customer segments" help="Target customer groups, for example office workers, families, tourists." value={payload.profile.customerSegments} onChange={(value) => updateProfile("customerSegments", String(value))} />
                <TextField label="Marketing channels" help="Optional current channels such as Instagram, TikTok, Google Maps, or flyers." value={payload.profile.marketingChannels} onChange={(value) => updateProfile("marketingChannels", String(value))} />
                <TextField label="Overstock / unsold issues" help="Optional note about slow-moving inventory, waste, or unsold products." value={payload.financials.overstockIssues} onChange={(value) => updateFinancial("overstockIssues", String(value))} />
              </div>
              <div className="mt-5">
                <FieldLabel label="Business goals" required help="Select every objective the report should optimize for. Design output appears only when branding/interior design is selected." />
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => {
                    const active = payload.profile.goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                          active ? "bg-fern text-white" : "bg-paper text-ink ring-1 ring-ink/10 hover:ring-fern"
                        }`}
                      >
                        {active ? <Check className="h-4 w-4" /> : null}
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-ink/50">File upload</p>
                  <h2 className="mt-1 text-xl font-semibold">Evidence Files</h2>
                </div>
                <FileSpreadsheet className="h-5 w-5 text-clay" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/62">
                Sales CSV is the most important upload. If you do not upload sales data, complete the required financial fields marked with <span className="font-semibold text-clay">*</span>.
              </p>
              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper p-3 text-sm font-semibold text-ink transition hover:border-fern">
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4 text-fern" />
                    Upload sales CSV
                    {!payload.financials.monthlyRevenue ? <span className="text-clay">*</span> : null}
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      void handleSalesUpload(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {(["product", "cost", "inventory", "marketing"] as UploadedSource["kind"][]).map((kind) => (
                  <label key={kind} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-3 text-sm font-semibold capitalize text-ink transition hover:border-fern">
                    {kind} file optional
                    <input
                      className="sr-only"
                      type="file"
                      accept=".csv,.txt,.pdf,.xlsx"
                      onChange={(event) => {
                        handleSupportingUpload(kind, event.currentTarget.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-4 rounded-md bg-mint p-3 text-sm leading-5 text-fern">{uploadMessage}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={downloadCsvTemplate} className="h-10 rounded-md border border-ink/12 bg-white px-3 text-sm font-semibold text-ink hover:border-fern">
                  Download CSV Template
                </button>
                <button type="button" onClick={resetForm} className="inline-flex h-10 items-center gap-2 rounded-md border border-ink/12 bg-white px-3 text-sm font-semibold text-ink hover:border-fern">
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase text-ink/50">Input coverage</p>
              <h2 className="mt-1 text-xl font-semibold">Required vs Optional</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-ink/68">
                <p><span className="font-semibold text-clay">*</span> means the field is required before analysis can begin.</p>
                <p>Please complete all available fields and upload relevant evidence whenever possible. The more complete your data is, the more accurate, specific, and actionable the generated report will be.</p>
              </div>
            </Card>
          </aside>
        </div>

        {advancedOpen ? (
          <Card className="mt-5 border-ink/15 bg-white">
            <div className="flex items-start gap-3">
              <Lock className="mt-1 h-5 w-5 shrink-0 text-ink/45" aria-hidden="true" />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">LLM Configuration</h2>
                  <button type="button" onClick={() => setAdvancedOpen(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-paper">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm leading-6 text-ink/62">
                  Defaults are loaded from the local server configuration. API key override is optional; leave blank to use the local default key.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <TextField label="Provider" value={payload.aiConfig?.provider} onChange={(value) => updateAiConfig("provider", String(value))} />
                  <TextField label="Endpoint" value={payload.aiConfig?.baseUrl} onChange={(value) => updateAiConfig("baseUrl", String(value))} />
                  <TextField label="Model ID" value={payload.aiConfig?.model} onChange={(value) => updateAiConfig("model", String(value))} />
                  <TextField
                    label="API key override"
                    type="password"
                    value={payload.aiConfig?.apiKey}
                    onChange={(value) => updateAiConfig("apiKey", String(value))}
                    placeholder="Using local default"
                  />
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {error ? <p className="mt-5 rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="inline-flex h-9 w-fit items-center gap-2 rounded-md px-2 text-xs font-semibold text-ink/45 transition hover:bg-white hover:text-ink"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Advanced
          </button>
          <button
            type="button"
            onClick={startAnalysis}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-fern px-6 text-sm font-semibold text-white transition hover:bg-ink"
          >
            Start Analysis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {agreementOpen ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ink/82 px-4 py-6 backdrop-blur-md">
          <div className="mx-auto max-w-4xl rounded-lg border border-white/14 bg-pearl p-5 text-ink shadow-panel sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-clay">Before using KITSUNE</p>
                <h2 className="mt-2 text-3xl font-semibold">Use Agreement and Quick Guide</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/64">
                  Please review how KITSUNE analyzes your business data before entering the workspace.
                </p>
              </div>
              <ShieldCheck className="h-9 w-9 text-fern" aria-hidden="true" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border border-ink/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-clay" aria-hidden="true" />
                  <h3 className="font-semibold">How to use the system</h3>
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-ink/68">
                  <p>1. Complete the required fields marked with <span className="font-semibold text-clay">*</span>.</p>
                  <p>2. Upload sales CSV if available, plus optional product, cost, inventory, or marketing files.</p>
                  <p>3. Click Start Analysis. The system calls the configured LLM, validates the output, then opens the report.</p>
                  <p>4. Review KPI charts, expansion advice, marketing actions, roadmap, and export the report as PDF.</p>
                </div>
              </section>

              <section className="rounded-lg border border-ink/10 bg-white p-4">
                <h3 className="font-semibold">What KITSUNE does</h3>
                <div className="mt-3 space-y-2 text-sm leading-6 text-ink/68">
                  <p>It analyzes sales, cost, customer, product, and location evidence for SME restaurants and retailers.</p>
                  <p>It produces business health scoring, KPI charts, diagnosis, recommendations, Hong Kong expansion zones, marketing plans, and a 90-day roadmap.</p>
                  <p>Branding and interior design advice is generated only when you select that goal.</p>
                </div>
              </section>

              <section className="rounded-lg border border-ink/10 bg-white p-4">
                <h3 className="font-semibold">Data security and privacy</h3>
                <div className="mt-3 space-y-2 text-sm leading-6 text-ink/68">
                  <p>Data is transmitted to the configured model endpoint over HTTPS/TLS when real LLM mode is used.</p>
                  <p>The application server does not persist uploaded business payloads to a database. Browser-stored input payloads are removed after the report is generated.</p>
                  <p>Reports remain in local browser storage so you can export them, and can be cleared by starting a new analysis or clearing browser storage.</p>
                </div>
              </section>

              <section className="rounded-lg border border-ink/10 bg-white p-4">
                <h3 className="font-semibold">Terms and limitations</h3>
                <div className="mt-3 space-y-2 text-sm leading-6 text-ink/68">
                  <p>This is an AI-assisted business intelligence system for planning and decision support.</p>
                  <p>It is not legal, accounting, tax, licensing, real-estate, or investment advice.</p>
                  <p>You are responsible for ensuring you have permission to upload any business files used for analysis.</p>
                </div>
              </section>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/72">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-fern"
                checked={agreementChecked}
                onChange={(event) => setAgreementChecked(event.target.checked)}
              />
              <span>
                I have read and agree to the use agreement, data handling notice, and service limitations.
              </span>
            </label>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={!agreementChecked}
                onClick={acceptAgreement}
                className="inline-flex h-11 items-center justify-center rounded-md bg-fern px-5 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/25"
              >
                Agree and enter workspace
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {templateDialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-clay">Internal template loader</p>
                <h2 className="mt-1 text-xl font-semibold">Upload sample package</h2>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Uploading a KITSUNE sample package fills the form, attaches evidence files, loads an internal analysis sequence, and prepares a preset report.
                </p>
              </div>
              <button type="button" onClick={() => setTemplateDialogOpen(false)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-paper">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-fern px-4 py-3 text-sm font-semibold text-white hover:bg-ink">
                <Upload className="h-4 w-4" />
                Upload template JSON
                <input
                  className="sr-only"
                  type="file"
                  accept=".json,application/json"
                  onChange={(event) => {
                    void handleTemplateUpload(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button type="button" onClick={downloadHiddenTemplate} className="h-10 rounded-md border border-ink/12 bg-white px-3 text-sm font-semibold text-ink hover:border-fern">
                Download template file
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
