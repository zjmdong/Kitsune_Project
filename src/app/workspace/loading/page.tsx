"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, BrainCircuit, CheckCircle2, Loader2 } from "lucide-react";
import { isPayload, payloadStorageKey, reportStorageKey } from "@/lib/workflow";
import type { AnalysisPayload, FinalConsultantReport, LoadingStep } from "@/lib/types";

const realPhases: LoadingStep[] = [
  { progress: 7, stage: "Validating business profile", thought: "Checking required business context, goals, and location inputs." },
  { progress: 18, stage: "Preparing uploaded evidence", thought: "Normalizing manual inputs and uploaded sales/product files for the model." },
  { progress: 34, stage: "Calling configured LLM", thought: "Sending the business payload to the configured model endpoint for full analysis." },
  { progress: 58, stage: "Waiting for AI consultant output", thought: "The model is calculating KPIs, diagnosis, recommendations, and expansion scenarios." },
  { progress: 82, stage: "Validating report structure", thought: "Checking the report shape so charts, scores, and PDF export can render correctly." },
  { progress: 96, stage: "Finalizing report", thought: "Preparing the final consultant report page." }
];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function LoadingPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(realPhases[0].stage);
  const [activeThought, setActiveThought] = useState(realPhases[0].thought);
  const [logs, setLogs] = useState<string[]>([realPhases[0].thought]);
  const [error, setError] = useState("");
  const reportReady = useRef(false);

  const modeLabel = useMemo(() => {
    if (!payload) return "Preparing analysis";
    return payload.mode === "template" ? "Analysis workflow" : "LLM analysis";
  }, [payload]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("template") === "branchwise") {
      void fetch("/api/demo-template")
        .then((response) => response.json())
        .then((template: { payload?: AnalysisPayload }) => {
          if (template.payload && isPayload(template.payload)) {
            setPayload(template.payload);
          } else {
            setError("Demo template could not be loaded.");
          }
        })
        .catch(() => setError("Demo template could not be loaded."));
      return;
    }

    const raw = localStorage.getItem(payloadStorageKey);
    if (!raw) {
      setError("No analysis input found. Please return to the input page.");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isPayload(parsed)) {
        setError("Analysis input is invalid. Please rebuild the input form.");
        return;
      }
      setPayload(parsed);
    } catch {
      setError("Analysis input is invalid. Please rebuild the input form.");
    }
  }, []);

  useEffect(() => {
    if (!payload) return;
    const activePayload = payload;
    let mounted = true;
    let timer: number | undefined;

    function applyStep(step: LoadingStep) {
      if (!mounted) return;
      setProgress(step.progress);
      setActiveStage(step.stage);
      setActiveThought(step.thought);
      setLogs((current) => (current.includes(step.thought) ? current : [...current, step.thought]));
    }

    async function runTemplateWorkflow() {
      const script = activePayload.loadingScript?.length ? activePayload.loadingScript : realPhases;
      for (const step of script) {
        applyStep(step);
        await wait(step.durationMs ?? 850);
      }

      if (!activePayload.templateReport) {
        if (mounted) setError("Template report is missing from the uploaded template.");
        return;
      }

      localStorage.setItem(reportStorageKey, JSON.stringify(activePayload.templateReport));
      reportReady.current = true;
      if (mounted) {
        setProgress(100);
        window.setTimeout(() => router.push("/workspace/report"), 550);
      }
    }

    async function runRealWorkflow() {
      const startedAt = Date.now();
      timer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const syntheticProgress = Math.min(95, Math.round(elapsed / 120));
        const phase = realPhases.reduce((current, item) => (syntheticProgress >= item.progress ? item : current), realPhases[0]);
        if (mounted) {
          setProgress((current) => Math.max(current, syntheticProgress));
          setActiveStage(phase.stage);
          setActiveThought(phase.thought);
          setLogs((current) => (current.includes(phase.thought) ? current : [...current, phase.thought]));
        }
      }, 250);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activePayload)
        });

        if (!response.ok) {
          const detail = (await response.json()) as { error?: string };
          throw new Error(detail.error ?? "Analysis API failed.");
        }

        const report = (await response.json()) as FinalConsultantReport;
        localStorage.setItem(reportStorageKey, JSON.stringify(report));
        reportReady.current = true;
        if (mounted) {
          setProgress(100);
          setActiveStage("Report ready");
          setActiveThought("The report is ready. Opening the final consultant report page.");
          setLogs((current) => [...current, "The report is ready. Opening the final consultant report page."]);
          window.setTimeout(() => router.push("/workspace/report"), 550);
        }
      } catch (event) {
        const message = event instanceof Error ? event.message : "Analysis failed.";
        if (mounted) setError(message);
      } finally {
        if (timer) window.clearInterval(timer);
      }
    }

    if (activePayload.mode === "template") {
      void runTemplateWorkflow();
    } else {
      void runRealWorkflow();
    }

    return () => {
      mounted = false;
      if (timer) window.clearInterval(timer);
    };
  }, [payload, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-8 text-white">
      <section className="w-full max-w-3xl rounded-lg border border-white/12 bg-white/8 p-6 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brass">Step 2 of 3</p>
            <h1 className="mt-1 text-3xl font-semibold">AI Analysis Workspace</h1>
            <p className="mt-2 text-sm leading-6 text-white/68">{modeLabel} is processing. The report will open automatically when complete.</p>
          </div>
          {error ? <AlertTriangle className="h-9 w-9 text-clay" /> : reportReady.current ? <CheckCircle2 className="h-9 w-9 text-mint" /> : <Loader2 className="h-9 w-9 animate-spin text-brass" />}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{activeStage}</span>
            <span className="text-white/68">{progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-brass transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-4 rounded-md bg-white/10 p-3 text-sm leading-6 text-white/76">
            <BrainCircuit className="mr-2 inline h-4 w-4 text-brass" aria-hidden="true" />
            {activeThought}
          </p>
        </div>

        <div className="mt-6 rounded-lg bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Bot className="h-4 w-4 text-brass" aria-hidden="true" />
            Visible AI work log
          </div>
          <div className="space-y-2">
            {logs.map((log) => (
              <p key={log} className="rounded-md bg-white/7 px-3 py-2 text-sm leading-5 text-white/72">
                {log}
              </p>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-md bg-clay/18 p-4 text-sm leading-6 text-white">
            <p className="font-semibold">Analysis stopped</p>
            <p className="mt-1 text-white/76">{error}</p>
            <Link href="/workspace/input" className="mt-4 inline-flex h-10 items-center rounded-md bg-white px-4 font-semibold text-ink">
              Back to input
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
