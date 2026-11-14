import { NextResponse } from "next/server";
import { runRealAnalysis } from "@/lib/analysis-server";
import { generateSimulatedReport } from "@/lib/simulation";
import { showcaseUnavailableResponse } from "@/lib/showcase";
import type { AnalysisPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unavailable = showcaseUnavailableResponse();
  if (unavailable) return unavailable;

  const payload = (await request.json()) as AnalysisPayload;

  if (payload.mode === "template") {
    return NextResponse.json(generateSimulatedReport(payload));
  }

  try {
    const report = await runRealAnalysis(payload);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown model error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
