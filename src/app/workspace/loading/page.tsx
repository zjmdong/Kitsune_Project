"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { isPayload, payloadStorageKey, reportStorageKey } from "@/lib/workflow";
import type { AnalysisPayload, FinalConsultantReport, LoadingStep } from "@/lib/types";

type StreamEvent =
  | { type: "progress"; progress: number; stage: string; log: string }
  | { type: "output"; channel: "request" | "raw" | "content" | "thinking" | "system"; text: string }
  | { type: "done"; report: FinalConsultantReport }
  | { type: "error"; message: string };

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function LoadingPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [progress, setProgress] = useState(2);
  const [activeStage, setActiveStage] = useState("Preparing analysis");
  const [workingLog, setWorkingLog] = useState("Preparing analysis workspace...\n");
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);

  function appendLog(text: string) {
    setWorkingLog((current) => `${current}${text}`);
  }

  function applyProgress(progressValue: number, stage: string, log: string) {
    setProgress(Math.max(0, Math.min(100, progressValue)));
    setActiveStage(stage);
    appendLog(`\n[${stage}] ${log}\n`);
  }

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [workingLog]);

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

    async function runTemplateWorkflow() {
      const script: LoadingStep[] = activePayload.loadingScript?.length
        ? activePayload.loadingScript
        : [{ progress: 100, stage: "Template report ready", thought: "Loaded the preset report from the uploaded template.", durationMs: 700 }];

      for (const step of script) {
        if (!mounted) return;
        applyProgress(step.progress, step.stage, step.thought);
        await wait(step.durationMs ?? 850);
      }

      if (!activePayload.templateReport) {
        if (mounted) setError("Template report is missing from the uploaded template.");
        return;
      }

      localStorage.setItem(reportStorageKey, JSON.stringify(activePayload.templateReport));
      localStorage.removeItem(payloadStorageKey);
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
            if (event.type === "output") {
              appendLog(event.text);
            }
            if (event.type === "error") {
              throw new Error(event.message);
            }
            if (event.type === "done") {
              localStorage.setItem(reportStorageKey, JSON.stringify(event.report));
              localStorage.removeItem(payloadStorageKey);
              applyProgress(100, "Opening report", "Report ready.");
              window.setTimeout(() => router.push("/workspace/report"), 550);
              return;
            }
          }
        }
      } catch (event) {
        const message = event instanceof Error ? event.message : "Analysis failed.";
        if (mounted) {
          setError(message);
          appendLog(`\n[Error] ${message}\n`);
        }
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-brass">Step 2 of 3</p>
            <h1 className="mt-1 text-3xl font-semibold">AI Analysis Workspace</h1>
          </div>
          {error ? <AlertTriangle className="h-9 w-9 text-clay" /> : <Loader2 className="h-9 w-9 animate-spin text-brass" />}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{activeStage}</span>
            <span className="text-white/68">{progress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/12">
            <div className="h-full rounded-full bg-brass transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-black/24 p-4">
          <p className="mb-3 text-sm font-semibold text-white">Working......</p>
          <div
            ref={logRef}
            className="h-[420px] overflow-y-auto rounded-md border border-white/10 bg-black/35 p-4 font-mono text-xs leading-5 text-white/76"
          >
            <pre className="whitespace-pre-wrap break-words">{workingLog}</pre>
          </div>
        </div>

        {error ? (
          <Link href="/workspace/input" className="mt-4 inline-flex h-10 items-center rounded-md bg-white px-4 text-sm font-semibold text-ink">
            Back to input
          </Link>
        ) : null}
      </section>
    </main>
  );
}
