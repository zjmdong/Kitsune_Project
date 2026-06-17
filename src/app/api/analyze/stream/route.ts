import { runRealAnalysis } from "@/lib/analysis-server";
import { generateSimulatedReport } from "@/lib/simulation";
import type { AnalysisPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEvent(event: unknown) {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AnalysisPayload;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: unknown) => {
        if (!closed) controller.enqueue(encodeEvent(event));
      };
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      void (async () => {
        try {
          if (payload.mode === "template") {
            const report = payload.templateReport ?? generateSimulatedReport(payload);
            send({ type: "progress", progress: 100, stage: "Template report ready", log: "Loaded the hidden pitch template report from the uploaded template package." });
            send({ type: "done", report });
            close();
            return;
          }

          const report = await runRealAnalysis(payload, (event) => send({ type: "progress", ...event }));
          send({ type: "done", report });
          close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Analysis failed.";
          send({ type: "error", message });
          close();
        }
      })();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
