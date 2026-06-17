"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Database, FileSpreadsheet, Lock, RefreshCw, Settings2, Upload, X } from "lucide-react";
import { buildCsvTemplate } from "@/lib/analysis";
import { parseSalesCsv } from "@/lib/csv";
import { createSampleSalesRecords } from "@/lib/sample-data";
import { formatNumber } from "@/lib/format";
import { createDemoTemplate, isBranchWiseDemoTemplate } from "@/lib/demo-template";
import { createDefaultPayload, defaultAiConfig, goalOptions, payloadStorageKey, reportStorageKey } from "@/lib/workflow";
import type { AiConfig, AnalysisPayload, FinancialInput, GoalOption, IntakeProfile, UploadedSource } from "@/lib/types";

function inputClass() {
  return "h-11 w-full rounded-md border border-ink/12 bg-white px-3 text-sm text-ink shadow-sm transition focus:border-clay";
}

function labelClass() {
  return "mb-1.5 block text-xs font-semibold uppercase text-ink/55";
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-ink/10 bg-white p-5 shadow-panel ${className}`}>{children}</section>;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  type?: "text" | "number" | "password";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      <input
        className={inputClass()}
        type={type}
        placeholder={placeholder}
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

export default function InputPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AnalysisPayload>(() => createDefaultPayload());
  const [uploadMessage, setUploadMessage] = useState("Upload sales evidence or complete the manual fields to start a real LLM analysis.");
  const [error, setError] = useState("");
  const [titleClicks, setTitleClicks] = useState(0);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const hasTemplateLoaded = payload.mode === "template";
  const configReady = useMemo(() => Boolean(payload.aiConfig?.baseUrl && payload.aiConfig?.model), [payload.aiConfig]);

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
    const blob = new Blob([buildCsvTemplate(createSampleSalesRecords())], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "branchwise-sales-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadHiddenTemplate() {
    const template = createDemoTemplate();
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "branchwise-hidden-demo-template.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleTemplateUpload(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isBranchWiseDemoTemplate(parsed)) {
        setError("Template file is not a valid BranchWise hidden demo template.");
        return;
      }
      setPayload({
        ...parsed.payload,
        mode: "template",
        loadingScript: parsed.loadingScript,
        templateReport: parsed.payload.templateReport,
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

  function startAnalysis() {
    if (!payload.profile.businessName || !payload.profile.businessType || !payload.profile.city || !payload.profile.area) {
      setError("Please complete business name, business type, city, and area before analysis.");
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
                Business Input Workspace
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/62">
                Fill in business context, upload evidence files, and start a real LLM analysis. Uploaded templates are only used for internal pitch rehearsal.
              </p>
            </div>
            <span className="inline-flex h-9 items-center rounded-full bg-mint px-3 text-xs font-semibold text-fern">
              {hasTemplateLoaded ? "Evidence package loaded" : "LLM analysis ready"}
            </span>
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
                <TextField label="Business name" value={payload.profile.businessName} onChange={(value) => updateProfile("businessName", String(value))} />
                <SelectField label="Business type" value={payload.profile.businessType} options={["Restaurant", "Cafe", "Retail", "Bakery", "Other"]} onChange={(value) => updateProfile("businessType", value)} />
                <SelectField label="Business size" value={payload.profile.businessSize} options={["Single store", "Small chain", "Chain"]} onChange={(value) => updateProfile("businessSize", value as IntakeProfile["businessSize"])} />
                <TextField label="City" value={payload.profile.city} onChange={(value) => updateProfile("city", String(value))} />
                <TextField label="Area / District" value={payload.profile.area} onChange={(value) => updateProfile("area", String(value))} />
                <TextField label="Employees" type="number" value={payload.profile.employees || undefined} onChange={(value) => updateProfile("employees", Number(value ?? 0))} />
                <TextField label="Opening hours" value={payload.profile.openingHours} onChange={(value) => updateProfile("openingHours", String(value))} />
                <SelectField label="Business model" value={payload.profile.businessModel} options={["Dine-in", "Takeaway", "Hybrid", "Retail"]} onChange={(value) => updateProfile("businessModel", value as IntakeProfile["businessModel"])} />
                <TextField label="Seating capacity optional" type="number" value={payload.profile.seatingCapacity} onChange={(value) => updateProfile("seatingCapacity", value ? Number(value) : undefined)} />
                <TextField label="Daily customer count" type="number" value={payload.profile.dailyCustomerCount} onChange={(value) => updateProfile("dailyCustomerCount", value ? Number(value) : undefined)} />
              </div>
            </Card>

            <Card>
              <p className="text-xs font-semibold uppercase text-ink/50">Manual input</p>
              <h2 className="mt-1 text-xl font-semibold">Financial, Customer, and Goal Inputs</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <TextField label="Monthly revenue" type="number" value={payload.financials.monthlyRevenue} onChange={(value) => updateFinancial("monthlyRevenue", value ? Number(value) : undefined)} />
                <TextField label="Rent cost" type="number" value={payload.financials.rentCost} onChange={(value) => updateFinancial("rentCost", value ? Number(value) : undefined)} />
                <TextField label="Labor cost" type="number" value={payload.financials.laborCost} onChange={(value) => updateFinancial("laborCost", value ? Number(value) : undefined)} />
                <TextField label="Ingredient/product cost" type="number" value={payload.financials.ingredientCost} onChange={(value) => updateFinancial("ingredientCost", value ? Number(value) : undefined)} />
                <TextField label="Utilities optional" type="number" value={payload.financials.utilitiesCost} onChange={(value) => updateFinancial("utilitiesCost", value ? Number(value) : undefined)} />
                <TextField label="Gross margin % optional" type="number" value={payload.financials.grossMargin} onChange={(value) => updateFinancial("grossMargin", value ? Number(value) : undefined)} />
                <TextField label="Peak hours" value={payload.profile.peakHours} onChange={(value) => updateProfile("peakHours", String(value))} />
                <TextField label="Off-peak hours" value={payload.profile.offPeakHours} onChange={(value) => updateProfile("offPeakHours", String(value))} />
                <TextField label="Repeat customer rate %" type="number" value={payload.profile.repeatCustomerRate} onChange={(value) => updateProfile("repeatCustomerRate", value ? Number(value) : undefined)} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <TextField label="Customer segments" value={payload.profile.customerSegments} onChange={(value) => updateProfile("customerSegments", String(value))} />
                <TextField label="Marketing channels optional" value={payload.profile.marketingChannels} onChange={(value) => updateProfile("marketingChannels", String(value))} />
              </div>
              <div className="mt-5">
                <p className={labelClass()}>Business goals</p>
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
                Sales CSV is the most important upload. Product, cost, inventory, and marketing files are optional context.
              </p>
              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper p-3 text-sm font-semibold text-ink transition hover:border-fern">
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4 text-fern" />
                    Upload sales CSV
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
                <p><strong className="text-ink">Required manual:</strong> profile, location, operating model, goals.</p>
                <p><strong className="text-ink">Recommended upload:</strong> sales/product CSV for KPI accuracy.</p>
                <p><strong className="text-ink">Optional manual:</strong> gross margin, utilities, seating, repeat rate, waste.</p>
                <p><strong className="text-ink">Optional upload:</strong> inventory, marketing, cost files for richer diagnosis.</p>
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

      {templateDialogOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-clay">Internal template loader</p>
                <h2 className="mt-1 text-xl font-semibold">Upload pitch template</h2>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Uploading a BranchWise template fills the form, attaches evidence files, loads the fake AI work script, and prepares the preset report.
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
