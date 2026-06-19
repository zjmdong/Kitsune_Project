import { analysisWorkflow, buildAnalysisPrompt, extractJson, promptVersion } from "./analysis-prompt";
import { generateSimulatedReport, normalizeFinalReport } from "./simulation";
import type { AnalysisPayload, FinalConsultantReport, LoadingStep } from "./types";

const defaultEndpoint = "https://opencode.ai/zen/go/v1/chat/completions";
const defaultModel = "deepseek-v4-flash";

export type AnalysisProgressEvent = {
  type: "progress";
  progress: number;
  stage: string;
  log: string;
} | {
  type: "output";
  channel: "thinking" | "system";
  text: string;
};

type ChatResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
      reasoning_content?: string;
    };
    text?: string;
  }>;
};

function emitProgress(onEvent: ((event: AnalysisProgressEvent) => void) | undefined, progress: number, stage: string, log: string) {
  onEvent?.({ type: "progress", progress, stage, log });
}

function emitOutput(
  onEvent: ((event: AnalysisProgressEvent) => void) | undefined,
  channel: Extract<AnalysisProgressEvent, { type: "output" }>["channel"],
  text: string
) {
  onEvent?.({ type: "output", channel, text });
}

function emitStage(
  onEvent: ((event: AnalysisProgressEvent) => void) | undefined,
  step: LoadingStep | undefined
) {
  if (!step) return;
  emitProgress(onEvent, step.progress, step.stage, step.thought);
}

function formatMoney(value: number | undefined, currencyCode = "HKD") {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unknown";
  return new Intl.NumberFormat(currencyCode === "USD" ? "en-US" : "en-HK", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0
  }).format(value ?? 0);
}

function formatPercentValue(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "unknown";
  return `${Math.round((value ?? 0) * 100)}%`;
}

function salesDateRange(payload: AnalysisPayload) {
  const dates = payload.salesRecords.map((record) => record.date).filter(Boolean).sort();
  if (!dates.length) return "no sales date range";
  return dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} to ${dates[dates.length - 1]}`;
}

function listNames(items: Array<{ name?: string; district?: string }>, limit = 3) {
  return items
    .slice(0, limit)
    .map((item) => item.name ?? item.district)
    .filter(Boolean)
    .join(", ");
}

function buildRealAnalysisScript(payload: AnalysisPayload, report: FinalConsultantReport): LoadingStep[] {
  const currencyCode = report.currencyCode ?? "HKD";
  const rows = payload.salesRecords.length;
  const sourceCount = payload.uploadedSources.length;
  const businessName = payload.profile.businessName || "this business";
  const market = report.marketContext ?? `${payload.profile.city}, ${payload.profile.area}`;
  const revenue = formatMoney(report.financialKpis.totalRevenue, currencyCode);
  const revenuePerDay = formatMoney(report.financialKpis.revenuePerDay, currencyCode);
  const aov = formatMoney(report.customerAnalytics.averageOrderValue, currencyCode);
  const costRatio = formatPercentValue(report.financialKpis.costRatio);
  const grossMargin = formatPercentValue(report.financialKpis.grossMargin);
  const topProducts = listNames(report.productPerformance.topByRevenue, 3) || "top-selling products";
  const topCategory = report.charts.categoryMix[0]?.name ?? "the leading category";
  const topChannel = report.charts.channelMix[0]?.name ?? "the leading channel";
  const leakage = report.consultingAnalysis.profitLeakageAnalysis[0] ?? "profit leakage is being checked against fixed costs and product mix.";
  const topZones = listNames(report.expansionAnalysis.recommendedZones, 3) || "shortlisted districts";
  const priority =
    report.priorityHighlights?.profitLeakageBenchmarking?.item ??
    report.priorityHighlights?.quickWins?.item ??
    "the highest-impact action is being selected from revenue, cost, and expansion scenarios.";
  const reliability = report.strategicFrameworks?.dataIntegrity.reliabilityScore;
  const marketSizing = report.strategicFrameworks?.marketSizing?.sam ?? `local reachable demand in ${market}`;

  return [
    {
      progress: 6,
      stage: "Reading uploaded evidence package",
      thought: `Loaded ${rows.toLocaleString()} sales rows from ${salesDateRange(payload)} plus ${sourceCount} supporting source${sourceCount === 1 ? "" : "s"} for ${businessName}.`
    },
    {
      progress: 14,
      stage: "Normalizing sales records",
      thought: `Mapped date, hour, product, category, units, revenue, cost, and channel fields so KITSUNE can compare ${topCategory}, ${topChannel}, and product-level contribution.`
    },
    {
      progress: 24,
      stage: "Computing financial baseline",
      thought: `Reconciled evidence-period revenue of ${revenue}, average daily revenue of ${revenuePerDay}, AOV of ${aov}, gross margin of ${grossMargin}, and cost ratio of ${costRatio}.`
    },
    {
      progress: 35,
      stage: "Segmenting demand patterns",
      thought: `Identified ${topProducts} as current demand anchors and separated peak, off-peak, channel, and category behavior for diagnosis.`
    },
    {
      progress: 47,
      stage: "Diagnosing profit leakage",
      thought: leakage
    },
    {
      progress: 58,
      stage: "Applying strategy frameworks",
      thought: `Building TAM/SAM/SOM, competitor alternatives, SWOT+, Porter five forces, business model review, and evidence confidence for ${market}. Current reliability score: ${reliability ?? "pending"}/100.`
    },
    {
      progress: 68,
      stage: "Scoring expansion options",
      thought: `Comparing rent pressure, audience fit, competition, transit access, and payback risk across ${topZones}.`
    },
    {
      progress: 78,
      stage: "Selecting highest-impact priorities",
      thought: `Testing which recommendation has the largest expected business impact. Current leading priority: ${priority}`
    },
    {
      progress: 88,
      stage: "Drafting recommendations",
      thought: `The model is turning the KPI baseline and ${marketSizing} into quick wins, operational fixes, marketing campaigns, expansion gates, and a 12-month roadmap.`
    },
    {
      progress: 96,
      stage: "Validating report structure",
      thought: "Checking that KPI charts, strategic validation, priority highlights, location ranking, financial impact simulation, marketing plan, and PDF-ready report fields are complete."
    }
  ];
}

function modelText(data: ChatResponse) {
  return (
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
    ""
  );
}

function hasHiddenReasoning(data: ChatResponse) {
  return Boolean(data.choices?.some((choice) => choice.message?.reasoning_content));
}

function extractDeltaText(value: unknown) {
  const data = value as {
    choices?: Array<{
      delta?: { content?: string; reasoning_content?: string };
      message?: { content?: string | Array<{ text?: string }>; reasoning_content?: string };
      text?: string;
    }>;
  };
  const contentParts: string[] = [];
  const reasoningParts: string[] = [];

  data.choices?.forEach((choice) => {
    if (choice.delta?.content) contentParts.push(choice.delta.content);
    if (choice.delta?.reasoning_content) reasoningParts.push(choice.delta.reasoning_content);
    if (typeof choice.message?.content === "string") contentParts.push(choice.message.content);
    if (Array.isArray(choice.message?.content)) {
      contentParts.push(choice.message.content.map((item) => item.text ?? "").join(""));
    }
    if (choice.message?.reasoning_content) reasoningParts.push(choice.message.reasoning_content);
    if (choice.text) contentParts.push(choice.text);
  });

  return {
    content: contentParts.join(""),
    reasoning: reasoningParts.join("")
  };
}

async function readStreamingModelResponse(
  response: Response,
  onEvent: ((event: AnalysisProgressEvent) => void) | undefined,
  streamStages: LoadingStep[] = []
) {
  if (!response.body) {
    const text = await response.text();
    const data = JSON.parse(text) as ChatResponse;
    return { content: modelText(data), reasoningSeen: hasHiddenReasoning(data), rawText: text };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let rawText = "";
  let reasoningSeen = false;
  let contentStarted = false;
  let streamStageIndex = 0;

  const emitNextStreamStage = () => {
    const step = streamStages[streamStageIndex];
    if (step) {
      emitStage(onEvent, step);
      streamStageIndex += 1;
    }
  };

  const handleData = (dataLine: string) => {
    const trimmed = dataLine.trim();
    if (!trimmed || trimmed === "[DONE]") return;
    rawText += `${trimmed}\n`;

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const { content: contentDelta, reasoning } = extractDeltaText(parsed);

      if (reasoning) {
        reasoningSeen = true;
        if (streamStageIndex === 0 || rawText.length + content.length > streamStageIndex * 4500) {
          emitNextStreamStage();
        }
      }

      if (contentDelta) {
        content += contentDelta;
        if (!contentStarted) {
          contentStarted = true;
          emitNextStreamStage();
        }
      }

      while (streamStageIndex < streamStages.length && rawText.length + content.length > (streamStageIndex + 1) * 6500) {
        emitNextStreamStage();
      }
    } catch {
      rawText += `${trimmed}\n`;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    lines.forEach((line) => {
      if (line.startsWith("data:")) {
        handleData(line.slice(5));
      } else if (line.trim().startsWith("{")) {
        handleData(line);
      }
    });
  }

  if (buffer.trim()) {
    if (buffer.trim().startsWith("data:")) {
      handleData(buffer.trim().slice(5));
    } else {
      handleData(buffer);
    }
  }

  return { content, reasoningSeen, rawText };
}

function configFromPayload(payload: AnalysisPayload) {
  const config = payload.aiConfig;
  return {
    provider: config?.provider || "OpenCode Zen",
    apiKey: config?.apiKey || process.env.KITSUNE_AI_API_KEY || process.env.BRANCHWISE_AI_API_KEY || process.env.AI_API_KEY || "",
    endpoint: config?.baseUrl || process.env.KITSUNE_AI_ENDPOINT || process.env.BRANCHWISE_AI_ENDPOINT || defaultEndpoint,
    model: config?.model || process.env.KITSUNE_AI_MODEL || process.env.BRANCHWISE_AI_MODEL || defaultModel
  };
}

async function requestJsonRepair({
  endpoint,
  apiKey,
  model,
  prompt,
  invalidText
}: {
  endpoint: string;
  apiKey: string;
  model: string;
  prompt: string;
  invalidText: string;
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You repair and complete JSON for KITSUNE reports. Return only valid JSON. Do not expose hidden chain-of-thought."
        },
        {
          role: "user",
          content: [
            "The prior model response was not parseable JSON.",
            "Using the original task and schema below, return a complete valid JSON patch.",
            "Preserve business meaning where possible, complete missing fields from the task context, and ensure priorityHighlights items exactly match their source arrays.",
            "",
            "Original task:",
            prompt,
            "",
            "Invalid model response:",
            invalidText.slice(0, 30000)
          ].join("\n")
        }
      ],
      thinking: { type: "enabled" },
      reasoning_effort: "max",
      response_format: { type: "json_object" },
      temperature: 0,
      stream: false
    })
  });

  if (!response.ok) {
    const rawText = await response.text();
    throw new Error(`JSON repair request failed (${response.status}): ${rawText.slice(0, 220)}`);
  }

  const data = (await response.json()) as ChatResponse;
  return modelText(data);
}

function fallbackAfterModelIssue(
  fallbackShape: FinalConsultantReport,
  payload: AnalysisPayload,
  provider: string,
  model: string,
  reason: string
): FinalConsultantReport {
  return {
    ...fallbackShape,
    mode: "real",
    generatedAt: new Date().toISOString(),
    selectedGoals: payload.profile.goals,
    visibleAnalysisLog: [
      ...(fallbackShape.visibleAnalysisLog ?? []),
      `The configured LLM did not complete the narrative pass: ${reason}`,
      "KITSUNE completed the report with the deterministic KPI, scoring, location, and roadmap engine so the owner can continue reviewing results."
    ].slice(0, 8),
    modelDiagnostics: {
      promptVersion,
      provider,
      model,
      workflow: analysisWorkflow,
      rawReasoningHidden: false
    }
  };
}

export async function runRealAnalysis(
  payload: AnalysisPayload,
  onEvent?: (event: AnalysisProgressEvent) => void
): Promise<FinalConsultantReport> {
  const { provider, apiKey, endpoint, model } = configFromPayload(payload);
  if (!apiKey) {
    throw new Error("Real LLM mode requires an API key. Configure it in .env.local or the advanced settings panel.");
  }

  const fallbackShape = generateSimulatedReport({ ...payload, mode: "real" });
  const visibleScript = buildRealAnalysisScript(payload, fallbackShape);
  emitStage(onEvent, visibleScript[0]);
  emitStage(onEvent, visibleScript[1]);
  emitStage(onEvent, visibleScript[2]);
  emitStage(onEvent, visibleScript[3]);
  emitStage(onEvent, visibleScript[4]);

  const prompt = buildAnalysisPrompt(payload, fallbackShape);

  emitStage(onEvent, visibleScript[5]);
  const timeout = AbortSignal.timeout(180_000);
  const requestBody = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are KITSUNE. Return only valid JSON for the requested consultant report. Do not expose hidden chain-of-thought."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    thinking: { type: "enabled" },
    reasoning_effort: "max",
    response_format: { type: "json_object" },
    temperature: 0.15,
    stream: true
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: timeout,
      body: JSON.stringify(requestBody)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed.";
    emitProgress(onEvent, 92, "Completing with KPI engine", "The model connection did not finish in time. KITSUNE is completing the report with the KPI, scoring, strategy, and roadmap engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model connection failed before a response was received: ${message}`);
  }

  if (!response.ok) {
    const rawText = await response.text();
    emitProgress(onEvent, 92, "Completing with KPI engine", "The configured model returned an error. KITSUNE is completing the report with the validated fallback analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model API request failed (${response.status}): ${rawText.slice(0, 220)}`);
  }

  const streamResult = await readStreamingModelResponse(response, onEvent, visibleScript.slice(6, 9));

  const text = streamResult.content;
  if (!text.trim()) {
    emitProgress(onEvent, 92, "Completing with KPI engine", "The model response did not contain a report body. KITSUNE is completing the report with the validated fallback analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, "Model response did not contain assistant content.");
  }

  let parsed: Partial<FinalConsultantReport>;
  try {
    parsed = JSON.parse(extractJson(text)) as Partial<FinalConsultantReport>;
  } catch {
    emitProgress(onEvent, 90, "Repairing report JSON", "The model returned non-parseable JSON, so KITSUNE is asking the model to repair and complete the structured report.");

    try {
      const repairedText = await requestJsonRepair({ endpoint, apiKey, model, prompt, invalidText: text || streamResult.rawText });
      parsed = JSON.parse(extractJson(repairedText)) as Partial<FinalConsultantReport>;
    } catch (repairError) {
      const message = repairError instanceof Error ? repairError.message : "JSON repair failed.";
      emitProgress(onEvent, 92, "Completing with KPI engine", "The model returned invalid report JSON and repair failed, so the deterministic KITSUNE analysis engine is completing the report.");
      return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model content was not valid report JSON: ${text.slice(0, 220)}; repair failed: ${message}`);
    }
  }

  emitStage(onEvent, visibleScript[9]);
  const report = normalizeFinalReport(
    {
      ...parsed,
      mode: "real",
      generatedAt: new Date().toISOString(),
      selectedGoals: payload.profile.goals,
      modelDiagnostics: {
        promptVersion,
        provider,
        model,
        workflow: analysisWorkflow,
        rawReasoningHidden: streamResult.reasoningSeen
      }
    },
    { ...fallbackShape, mode: "real", selectedGoals: payload.profile.goals }
  );

  if (report.visibleAnalysisLog?.length) {
    emitOutput(
      onEvent,
      "thinking",
      `\n[Model-visible analysis notes]\n${report.visibleAnalysisLog.map((item) => `- ${item}`).join("\n")}\n`
    );
  }
  emitProgress(onEvent, 100, "Opening consultant report", "The final report is ready with KPI charts, strategy validation, expansion ranking, marketing plan, and action roadmap.");
  return report;
}
