"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, BrainCircuit, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { isPayload, payloadStorageKey, reportStorageKey } from "@/lib/workflow";
import type { AnalysisPayload, FinalConsultantReport, LoadingStep } from "@/lib/types";

const initialStep = {
  progress: 2,
  stage: "Preparing analysis",
  log: "Opening the analysis workspace and loading the submitted business payload."
};

type StreamEvent =
  | { type: "progress"; progress: number; stage: string; log: string }
  | { type: "done"; report: FinalConsultantReport }
  | { type: "error"; message: string };

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function pushLog(setLogs: Dispatch<SetStateAction<string[]>>, log: string) {
  setLogs((current) => (current.includes(log) ? current : [...current, log]));
}

export default function LoadingPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [progress, setProgress] = useState(initialStep.progress);
  const [activeStage, setActiveStage] = useState(initialStep.stage);
  const [activeLog, setActiveLog] = useState(initialStep.log);
  const [logs, setLogs] = useState<string[]>([initialStep.log]);
  const [error, setError] = useState("");
  const reportReady = useRef(false);

  const isTemplate = payload?.mode === "template";
  const modeLabel = useMemo(() => {
    if (!payload) return "Preparing analysis";
    return isTemplate ? "Template rehearsal" : "Real LLM analysis";
  }, [isTemplate, payload]);

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

    function applyProgress(progressValue: number, stage: string, log: string) {
      if (!mounted) return;
      setProgress(Math.max(0, Math.min(100, progressValue)));
      setActiveStage(stage);
      setActiveLog(log);
      pushLog(setLogs, log);
    }

    async function runTemplateWorkflow() {
      const script: LoadingStep[] = activePayload.loadingScript?.length
        ? activePayload.loadingScript
        : [{ progress: 100, stage: "Template report ready", thought: "Loaded the preset report from the uploaded template.", durationMs: 700 }];

      for (const step of script) {
        applyProgress(step.progress, step.stage, step.thought);
        await wait(step.durationMs ?? 850);
      }

      if (!activePayload.templateReport) {
        if (mounted) setError("Template report is missing from the uploaded template.");
        return;
      }

      localStorage.setItem(reportStorageKey, JSON.stringify(activePayload.templateReport));
      localStorage.removeItem(payloadStorageKey);
      reportReady.current = true;
      if (mounted) {
        setProgress(100);
        window.setTimeout(() => router.push("/workspace/report"), 550);
      }
    }

    async function runRealWorkflow() {
      try {
        const response = await fetch("/api/analyze/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activePayload)
        });

        if (!response.ok) {
          throw new Error(`Analysis API failed with HTTP ${response.status}.`);
        }
        if (!response.body) {
          throw new Error("Analysis API did not return a progress stream.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (mounted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as StreamEvent;
            if (event.type === "progress") {
              applyProgress(event.progress, event.stage, event.log);
            }
            if (event.type === "error") {
              throw new Error(event.message);
            }
            if (event.type === "done") {
              localStorage.setItem(reportStorageKey, JSON.stringify(event.report));
              localStorage.removeItem(payloadStorageKey);
              reportReady.current = true;
              applyProgress(100, "Report ready", "The report is ready. Opening the final consultant report page.");
              window.setTimeout(() => router.push("/workspace/report"), 550);
              return;
            }
          }
        }
      } catch (event) {
        const message = event instanceof Error ? event.message : "Analysis failed.";
        if (mounted) setError(message);
      }
    }

    if (activePayload.mode === "template") {
      void runTemplateWorkflow();
    } else {
      void runRealWorkflow();
    }

    return () => {
      mounted = false;
    };
  }, [payload, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-8 text-white">
      <section className="w-full max-w-3xl rounded-lg border border-white/12 bg-white/8 p-6 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-brass">Step 2 of 3</p>
            <h1 className="mt-1 text-3xl font-semibold">AI Analysis Workspace</h1>
            <p className="mt-2 text-sm leading-6 text-white/68">
              {modeLabel} is processing. The report will open automatically when complete.
            </p>
          </div>
          {error ? (
            <AlertTriangle className="h-9 w-9 text-clay" />
          ) : reportReady.current ? (
            <CheckCircle2 className="h-9 w-9 text-mint" />
          ) : (
            <Loader2 className="h-9 w-9 animate-spin text-brass" />
          )}
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
            {activeLog}
          </p>
        </div>

        <div className="mt-4 rounded-md border border-white/10 bg-white/7 p-3 text-xs leading-5 text-white/62">
          <ShieldCheck className="mr-2 inline h-4 w-4 text-mint" aria-hidden="true" />
          This page shows real API workflow events and model-visible report notes. Raw hidden chain-of-thought is not displayed.
        </div>

        <div className="mt-6 rounded-lg bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Bot className="h-4 w-4 text-brass" aria-hidden="true" />
            {isTemplate ? "Template rehearsal log" : "Visible AI work log"}
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
