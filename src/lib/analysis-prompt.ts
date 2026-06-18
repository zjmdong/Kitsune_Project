import type { AnalysisPayload, FinalConsultantReport, SalesRecord } from "./types";
import { getMarketInstruction, getMarketLabel, inferCurrencyCode } from "./market";

export const promptVersion = "kitsune-analysis-v2";

export const analysisWorkflow = [
  "Validate required owner inputs and uploaded evidence.",
  "Normalize business profile, financial fields, sales records, and supporting files.",
  "Ask the configured LLM to produce a structured consultant report in the KITSUNE JSON contract.",
  "Parse and validate the model response against the report shape used by the UI.",
  "Render KPI charts, expansion analysis, marketing plan, roadmap, and optional design brief."
];

function topRecords(records: SalesRecord[], key: keyof Pick<SalesRecord, "revenue" | "cost" | "units">) {
  const byProduct = new Map<string, number>();
  records.forEach((record) => {
    byProduct.set(record.product, (byProduct.get(record.product) ?? 0) + Number(record[key] ?? 0));
  });
  return [...byProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([product, value]) => ({ product, value: Math.round(value) }));
}

function summarizeSales(records: SalesRecord[]) {
  const totalRevenue = records.reduce((sum, record) => sum + record.revenue, 0);
  const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
  const totalUnits = records.reduce((sum, record) => sum + record.units, 0);
  const channels = Array.from(new Set(records.map((record) => record.channel))).slice(0, 8);
  const categories = Array.from(new Set(records.map((record) => record.category))).slice(0, 8);

  return {
    rowCount: records.length,
    dateRange:
      records.length > 0
        ? {
            start: records[0]?.date,
            end: records[records.length - 1]?.date
          }
        : undefined,
    totalRevenue: Math.round(totalRevenue),
    totalCost: Math.round(totalCost),
    totalUnits,
    grossMargin: totalRevenue > 0 ? Number(((totalRevenue - totalCost) / totalRevenue).toFixed(4)) : undefined,
    channels,
    categories,
    topRevenueProducts: topRecords(records, "revenue"),
    topUnitProducts: topRecords(records, "units"),
    sampleRows: records.slice(0, 40)
  };
}

export function extractJson(text: string) {
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

export function compactPayloadForPrompt(payload: AnalysisPayload) {
  const currencyCode = inferCurrencyCode(payload);
  return {
    marketContext: getMarketLabel(payload),
    currencyCode,
    marketInstruction: getMarketInstruction(payload),
    profile: payload.profile,
    financials: payload.financials,
    uploadedSources: payload.uploadedSources,
    goals: payload.profile.goals,
    selectedDesignRequired: payload.profile.goals.includes("Branding/interior design"),
    salesEvidence: summarizeSales(payload.salesRecords),
    aiConfig: payload.aiConfig
      ? {
          provider: payload.aiConfig.provider,
          baseUrl: payload.aiConfig.baseUrl,
          model: payload.aiConfig.model,
          apiKey: payload.aiConfig.apiKey ? "[provided in request, not included in prompt]" : "[server default]"
        }
      : undefined
  };
}

export function buildAnalysisPrompt(payload: AnalysisPayload, fallbackShape: FinalConsultantReport) {
  const targetPatchShape = {
    executiveSummary: "one consultant-grade sentence",
    keyInsights: ["2-4 short insight bullets"],
    problemDiagnosis: ["2-4 short diagnosis bullets"],
    consultingAnalysis: fallbackShape.consultingAnalysis,
    recommendations: {
      quickWins: ["2-3 actions"],
      operationalImprovements: ["2-3 actions"],
      strategicMoves: ["2-3 actions"]
    },
    marketingStrategy: fallbackShape.marketingStrategy,
    designBrief: payload.profile.goals.includes("Branding/interior design")
      ? {
          interiorStyle: "one short style direction",
          moodboardPrompt: "one concise image-generation prompt",
          storefrontNotes: ["2-3 storefront notes"]
        }
      : "omit unless the user selected Branding/interior design",
    visibleAnalysisLog: ["5 concise model-visible work notes"]
  };

  const currencyCode = inferCurrencyCode(payload);
  const marketInstruction = getMarketInstruction(payload);

  return `You are KITSUNE, a senior business analyst for SME restaurant and retail owners.

Task:
Produce a business consultant report for a business owner who wants revenue growth, cost control, marketing improvement, and possibly expansion into a chain.

Workflow:
${analysisWorkflow.map((step, index) => `${index + 1}. ${step}`).join("\n")}

Rules:
- Return only valid JSON. No markdown, no code fences, no prose outside JSON.
- Do not expose hidden chain-of-thought. Include a field named "visibleAnalysisLog" with 5-8 concise, user-safe work notes explaining what evidence you used and what conclusions were drawn.
- ${marketInstruction}
- Use ${currencyCode} as the reporting currency for any narrative references to money.
- Treat location advice as AI-assisted planning intelligence, not legal or investment advice.
- If the user did not select "Branding/interior design", keep designBrief minimal because the UI will hide it.
- Use the exact JSON key names shown in the target shape. Numeric percentages must be decimals, for example 0.12 for 12%.
- Keep arrays concise but business-useful.
- The server already computes KPI charts and baseline scores, so focus on consultant interpretation, priorities, risks, marketing, expansion, and roadmap.
- Keep the total JSON response short enough to complete in one pass. Do not exceed 1,200 words.

Target JSON patch shape:
${JSON.stringify(targetPatchShape, null, 2)}

Sanitized user payload:
${JSON.stringify(compactPayloadForPrompt(payload), null, 2)}`;
}
