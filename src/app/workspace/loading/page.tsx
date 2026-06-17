"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, BrainCircuit, CheckCircle2, Loader2 } from "lucide-react";
import { isPayload, payloadStorageKey, reportStorageKey } from "@/lib/workflow";
import type { AnalysisPayload, FinalConsultantReport } from "@/lib/types";

const phases = [
  { at: 5, label: "Validating business profile", note: "Checking required business context, goals, and location inputs." },
  { at: 18, label: "Reading uploaded evidence", note: "Parsing sales rows and mapping optional cost, product, and inventory files." },
  { at: 36, label: "Calculating core KPIs", note: "Preparing revenue, profit, cost, product, customer, and operational metrics." },
  { at: 56, label: "Running consulting logic", note: "Looking for trend shifts, bottlenecks, profit leakage, and benchmark gaps." },
  { at: 76, label: "Simulating expansion scenarios", note: "Scoring expansion readiness, risk, location fit, break-even, and ROI." },
  { at: 92, label: "Generating final report", note: "Structuring executive summary, recommendations, roadmap, and marketing strategy." }
];

export default function LoadingPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeNote, setActiveNote] = useState(phases[0].note);
  const [logs, setLogs] = useState<string[]>([phases[0].note]);
  const [error, setError] = useState("");
  const reportReady = useRef(false);

  const currentPhase = useMemo(() => {
    return phases.reduce((current, phase) => (progress >= phase.at ? phase : current), phases[0]);
  }, [progress]);

  useEffect(() => {
    const raw = localStorage.getItem(payloadStorageKey);
    if (!raw) {
      setError("No analysis input found. Please return to the input page.");
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isPayload(parsed)) {
      setError("Analysis input is invalid. Please rebuild the input form.");
      return;
    }
    setPayload(parsed);
  }, []);

  useEffect(() => {
    if (!payload) return;

    let mounted = true;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(98, Math.round(elapsed / 95));
      setProgress((current) => Math.max(current, next));
    }, 220);

    async function runAnalysis() {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
          setTimeout(() => router.push("/workspace/report"), 650);
        }
      } catch (event) {
        const message = event instanceof Error ? event.message : "Analysis failed.";
        if (mounted) setError(message);
      } finally {
        window.clearInterval(timer);
      }
    }

    void runAnalysis();

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [payload, router]);

  useEffect(() => {
    const phase = phases.reduce((current, item) => (progress >= item.at ? item : current), phases[0]);
    setActiveNote(phase.note);
    setLogs((current) => (current.includes(phase.note) ? current : [...current, phase.note]));
  }, [progress]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-8 text-white">
      <section className="w-full max-w-3xl rounded-lg border border-white/12 bg-white/8 p-6 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brass">Step 2 of 3</p>
            <h1 className="mt-1 text-3xl font-semibold">AI Analysis Workspace</h1>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Mode: {payload?.mode === "real" ? "Real LLM Mode" : "Simulation Mode"} · The report will open automatically when complete.
            </p>
          </div>
          {error ? <AlertTriangle className="h-9 w-9 text-clay" /> : reportReady.current ? <CheckCircle2 className="h-9 w-9 text-mint" /> : <Loader2 className="h-9 w-9 animate-spin text-brass" />}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{currentPhase.label}</span>
            <span className="text-white/68">{progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-brass transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-4 rounded-md bg-white/10 p-3 text-sm leading-6 text-white/76">
            <BrainCircuit className="mr-2 inline h-4 w-4 text-brass" aria-hidden="true" />
            {activeNote}
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
