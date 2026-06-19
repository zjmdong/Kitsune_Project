import type { AnalysisPayload, FinalConsultantReport, SalesRecord } from "./types";
import { getMarketInstruction, getMarketLabel, inferCurrencyCode } from "./market";

export const promptVersion = "kitsune-analysis-v5";

export const analysisWorkflow = [
  "Validate required owner inputs, uploaded evidence, local market, and reporting currency.",
  "Build a deterministic evidence baseline from sales records, costs, product mix, customer signals, and owner goals.",
  "Apply strategic-analysis frameworks inspired by technical business strategy workflows: scope definition, evidence ledger, TAM/SAM/SOM, competitor alternatives, SWOT+, Porter five forces, business model review, and risk-adjusted recommendation design.",
  "Ask the configured LLM to interpret the baseline as a multi-role business analysis team: financial analyst, operations analyst, growth marketer, expansion strategist, risk reviewer, and strategy QA reviewer.",
  "Require the LLM to select one highest-impact priority per section and explain the business impact in user-safe terms.",
  "Parse and validate the model response against the report shape used by the UI, then fall back only for missing or invalid fields.",
  "Render KPI charts, expansion analysis, marketing plan, roadmap, priority highlights, and optional design brief."
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
    strategicFrameworks: fallbackShape.strategicFrameworks,
    recommendations: {
      quickWins: ["2-3 actions"],
      operationalImprovements: ["2-3 actions"],
      strategicMoves: ["2-3 actions"]
    },
    financialImpactSimulation: {
      expectedRevenueIncrease: "decimal, for example 0.12",
      expectedCostReduction: "decimal, for example 0.07",
      expectedProfitIncrease: "decimal, for example 0.18",
      roiEstimation: "one concise ROI/payback interpretation"
    },
    actionPlanRoadmap: {
      now: ["2-3 actions for 0-7 days"],
      next30Days: ["2-3 actions for 7-30 days"],
      next3Months: ["2-3 actions for 1-3 months"],
      next12Months: ["2-3 actions for 3-12 months"]
    },
    priorityHighlights: {
      keyInsights: { item: "copy exactly one item from keyInsights", reason: "one concise business-impact reason" },
      problemDiagnosis: { item: "copy exactly one item from problemDiagnosis", reason: "one concise business-impact reason" },
      bottleneckAnalysis: { item: "copy exactly one item from consultingAnalysis.bottleneckAnalysis", reason: "one concise business-impact reason" },
      profitLeakageBenchmarking: {
        item: "copy exactly one item from consultingAnalysis.profitLeakageAnalysis or consultingAnalysis.benchmarking",
        reason: "one concise business-impact reason"
      },
      scenarioSimulation: { item: "copy exactly one item from consultingAnalysis.scenarioSimulation", reason: "one concise business-impact reason" },
      quickWins: { item: "copy exactly one item from recommendations.quickWins", reason: "one concise business-impact reason" },
      operationalImprovements: { item: "copy exactly one item from recommendations.operationalImprovements", reason: "one concise business-impact reason" },
      strategicMoves: { item: "copy exactly one item from recommendations.strategicMoves", reason: "one concise business-impact reason" },
      marketingCampaigns: { item: "copy exactly one item from marketingStrategy.campaigns", reason: "one concise business-impact reason" },
      socialPosts: { item: "copy exactly one item from marketingStrategy.socialPosts", reason: "one concise business-impact reason" },
      roadmapNow: { item: "copy exactly one item from actionPlanRoadmap.now", reason: "one concise business-impact reason" },
      roadmapNext30Days: { item: "copy exactly one item from actionPlanRoadmap.next30Days", reason: "one concise business-impact reason" },
      roadmapNext3Months: { item: "copy exactly one item from actionPlanRoadmap.next3Months", reason: "one concise business-impact reason" },
      roadmapNext12Months: { item: "copy exactly one item from actionPlanRoadmap.next12Months", reason: "one concise business-impact reason" }
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

Deep analysis method:
1. Scope and hypothesis framing: identify the business model, expansion question, local market, target segments, success metric, and constraints before making recommendations.
2. Evidence ledger: distinguish uploaded sales evidence, owner-entered assumptions, deterministic KPI baseline, and any inference you make. Do not invent external citations.
3. Numeric audit: check currency, reporting period, revenue totals, AOV, gross margin, cost ratio, labor pressure, rent pressure, product contribution, and payback logic for internal consistency.
4. Market sizing: provide directional TAM/SAM/SOM reasoning using the supplied market and customer context. Mark confidence and missing evidence when third-party market data is absent.
5. Competitive landscape: identify direct alternatives, substitutes, defensibility, and watchouts from the business context. If competitor files are not uploaded, state that this is assumption-based.
6. Strategic frameworks: complete SWOT+, TOWS actions, Porter five forces, and business model review with practical SME actions rather than generic textbook labels.
7. Root-cause diagnosis: connect symptoms to operational, product, customer, marketing, or expansion constraints.
8. Scenario thinking: identify actions with the largest expected profit, revenue, cost, risk, or payback impact.
9. Local market grounding: use the supplied city, district, customer segments, and currency; avoid importing Hong Kong assumptions unless the business is clearly in Hong Kong.
10. Priority selection: for every list section, choose exactly one item that matters most to this business now.
11. Final QA: before returning JSON, verify that all required keys are present, priorityHighlights items exactly match existing array items, percentages are decimals, strategicFrameworks are complete, and no hidden reasoning is exposed.

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
- strategicFrameworks must improve reliability: identify evidence used, confidence level, missing evidence, assumption checks, competitive risk, Porter force intensity, and scalability constraints. Keep it specific to the business rather than generic.
- For priorityHighlights, select exactly one existing item per section based on current business impact or highest likely profit/revenue/cost improvement. Copy the selected item text exactly from the corresponding array. The reason must be a short user-safe business rationale, not hidden reasoning.
- Complete every requested JSON field. Keep wording concise and decision-oriented, but do not omit fields just to make the answer shorter.

Target JSON patch shape:
${JSON.stringify(targetPatchShape, null, 2)}

Sanitized user payload:
${JSON.stringify(compactPayloadForPrompt(payload), null, 2)}`;
}
