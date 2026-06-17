import { analysisWorkflow, buildAnalysisPrompt, extractJson, promptVersion } from "./analysis-prompt";
import { generateSimulatedReport, normalizeFinalReport } from "./simulation";
import type { AnalysisPayload, FinalConsultantReport } from "./types";

const defaultEndpoint = "https://opencode.ai/zen/go/v1/chat/completions";
const defaultModel = "deepseek-v4-flash";

export type AnalysisProgressEvent = {
  progress: number;
  stage: string;
  log: string;
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

function emit(onEvent: ((event: AnalysisProgressEvent) => void) | undefined, progress: number, stage: string, log: string) {
  onEvent?.({ progress, stage, log });
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

function configFromPayload(payload: AnalysisPayload) {
  const config = payload.aiConfig;
  return {
    provider: config?.provider || "OpenCode Zen",
    apiKey: config?.apiKey || process.env.BRANCHWISE_AI_API_KEY || process.env.AI_API_KEY || "",
    endpoint: config?.baseUrl || process.env.BRANCHWISE_AI_ENDPOINT || defaultEndpoint,
    model: config?.model || process.env.BRANCHWISE_AI_MODEL || defaultModel
  };
}

function endpointLabel(endpoint: string) {
  try {
    return new URL(endpoint).host;
  } catch {
    return "configured model endpoint";
  }
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
      "BranchWise completed the report with the deterministic KPI, scoring, location, and roadmap engine so the owner can continue reviewing results."
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
  emit(onEvent, 5, "Validating input", "Required owner inputs, goals, sales evidence, and LLM configuration are being checked.");

  const { provider, apiKey, endpoint, model } = configFromPayload(payload);
  if (!apiKey) {
    throw new Error("Real LLM mode requires an API key. Configure it in .env.local or the advanced settings panel.");
  }

  emit(onEvent, 14, "Preparing analytics contract", `Using ${promptVersion} with ${payload.salesRecords.length} sales rows and ${payload.uploadedSources.length} uploaded source references.`);
  const fallbackShape = generateSimulatedReport({ ...payload, mode: "real" });
  const prompt = buildAnalysisPrompt(payload, fallbackShape);

  emit(onEvent, 28, "Connecting to LLM", `Sending the structured analysis request to ${provider} (${model}) through ${endpointLabel(endpoint)}.`);
  const timeout = AbortSignal.timeout(75_000);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: timeout,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are BranchWise AI. Return only valid JSON for the requested consultant report. Do not expose hidden chain-of-thought."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed.";
    emit(onEvent, 92, "Completing with KPI engine", "The model connection did not finish in time, so the report is being completed with the deterministic BranchWise analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model connection failed before a response was received: ${message}`);
  }

  emit(onEvent, 62, "Receiving model response", `The model endpoint responded with HTTP ${response.status}; reading the report payload now.`);
  const rawText = await response.text();
  if (!response.ok) {
    emit(onEvent, 92, "Completing with KPI engine", "The model endpoint returned an error, so the report is being completed with the deterministic BranchWise analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model API request failed (${response.status}): ${rawText.slice(0, 220)}`);
  }

  emit(onEvent, 76, "Parsing model output", `Received ${rawText.length.toLocaleString()} characters from the model. Hidden reasoning, if returned by the provider, is not displayed raw.`);
  let data: ChatResponse;
  try {
    data = JSON.parse(rawText) as ChatResponse;
  } catch {
    emit(onEvent, 92, "Completing with KPI engine", "The model transport response was not JSON, so the report is being completed with the deterministic BranchWise analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model endpoint returned non-JSON transport data: ${rawText.slice(0, 180)}`);
  }

  const text = modelText(data);
  if (!text.trim()) {
    emit(onEvent, 92, "Completing with KPI engine", "The model response did not contain assistant content, so the report is being completed with the deterministic BranchWise analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, "Model response did not contain assistant content.");
  }

  let parsed: Partial<FinalConsultantReport>;
  try {
    parsed = JSON.parse(extractJson(text)) as Partial<FinalConsultantReport>;
  } catch {
    emit(onEvent, 92, "Completing with KPI engine", "The model returned invalid report JSON, so the report is being completed with the deterministic BranchWise analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model content was not valid report JSON: ${text.slice(0, 220)}`);
  }

  emit(onEvent, 90, "Validating report structure", "Normalizing the model report against the chart, KPI, roadmap, and expansion schema used by the UI.");
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
        rawReasoningHidden: hasHiddenReasoning(data)
      }
    },
    { ...fallbackShape, mode: "real", selectedGoals: payload.profile.goals }
  );

  emit(onEvent, 100, "Report ready", "The final report has been validated and is ready for rendering.");
  return report;
}
