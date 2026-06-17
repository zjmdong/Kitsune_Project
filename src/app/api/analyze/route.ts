import { NextResponse } from "next/server";
import { generateSimulatedReport, normalizeFinalReport } from "@/lib/simulation";
import type { AnalysisPayload, FinalConsultantReport } from "@/lib/types";

const defaultEndpoint = "https://opencode.ai/zen/go/v1/chat/completions";
const defaultModel = "deepseek-v4-flash";

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1];
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function compactPayload(payload: AnalysisPayload) {
  return {
    ...payload,
    aiConfig: payload.aiConfig
      ? {
          provider: payload.aiConfig.provider,
          baseUrl: payload.aiConfig.baseUrl,
          model: payload.aiConfig.model,
          apiKey: payload.aiConfig.apiKey ? "[provided in request, not included in prompt]" : ""
        }
      : undefined,
    salesRecords: payload.salesRecords.slice(0, 240)
  };
}

async function runRealModel(payload: AnalysisPayload) {
  const config = payload.aiConfig;
  const apiKey = config?.apiKey || process.env.BRANCHWISE_AI_API_KEY || process.env.AI_API_KEY;
  const endpoint = config?.baseUrl || process.env.BRANCHWISE_AI_ENDPOINT || defaultEndpoint;
  const model = config?.model || process.env.BRANCHWISE_AI_MODEL || defaultModel;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Real LLM mode requires an API key. Configure it in local .env.local or the advanced settings panel." },
      { status: 400 }
    );
  }

  const fallbackShape = generateSimulatedReport({ ...payload, mode: "real" });
  const prompt = `You are BranchWise AI, a business analyst for Hong Kong SME restaurant and retail owners.
Use the user's uploaded and manual inputs to compute every KPI and generate the final consultant report.
Return only valid JSON matching this exact structure. Do not include markdown.

Important output requirements:
- Executive Summary
- Business Health Score: overall, revenue, cost efficiency, growth potential
- Financial KPIs: revenue, profit, cost ratios, labor efficiency, ingredient cost, profit per customer
- Operational KPIs: peak hour efficiency, staff utilization, table turnover, inventory turnover
- Product Performance: top products by revenue/profit, low-margin products, contribution notes
- Customer Analytics: AOV, frequency, peak segments, estimated CLV
- Consulting Logic: trend, bottleneck, profit leakage, benchmarking, scenario simulation
- Recommendations: quick wins, operational improvements, strategic moves
- Marketing Strategy: social campaigns, discount strategy, retention, positioning
- Expansion Analysis: readiness score, zones, risk level, break-even estimation
- Financial Impact Simulation: revenue increase, cost reduction, profit increase, ROI
- Action Plan Roadmap: now, next 30 days, next 3 months, next 12 months
- Design/branding brief

JSON shape example:
${JSON.stringify({ ...fallbackShape, mode: "real", generatedAt: new Date().toISOString() }).slice(0, 9000)}

User payload:
${JSON.stringify(compactPayload(payload), null, 2)}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are BranchWise AI. Return only valid JSON for the requested report. No markdown, no commentary, no code fences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Model API request failed: ${detail.slice(0, 300)}` }, { status: 502 });
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
      choices?: Array<{ message?: { content?: string | Array<{ text?: string; type?: string }> }; text?: string }>;
    };
    const text =
      data.output_text ??
      data.choices
        ?.map((choice) => {
          const content = choice.message?.content;
          if (typeof content === "string") return content;
          if (Array.isArray(content)) return content.map((item) => item.text ?? "").join("\n");
          return choice.text ?? "";
        })
        .join("\n") ??
      data.output?.flatMap((item) => item.content ?? []).map((content) => content.text ?? "").join("\n") ??
      "";
    const parsed = JSON.parse(extractJson(text)) as Partial<FinalConsultantReport>;
    const report = normalizeFinalReport(
      { ...parsed, mode: "real", generatedAt: new Date().toISOString() },
      { ...fallbackShape, mode: "real" }
    );

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown model error";
    return NextResponse.json({ error: `Real mode failed: ${message}` }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AnalysisPayload;

  if (payload.mode === "real") {
    return runRealModel(payload);
  }

  return NextResponse.json(generateSimulatedReport(payload));
}
