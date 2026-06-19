import { analysisWorkflow, buildAnalysisPrompt, extractJson, promptVersion } from "./analysis-prompt";
import { generateSimulatedReport, normalizeFinalReport } from "./simulation";
import type { AnalysisPayload, FinalConsultantReport } from "./types";

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

function emitThinking(
  onEvent: ((event: AnalysisProgressEvent) => void) | undefined,
  title: string,
  body: string
) {
  emitOutput(onEvent, "thinking", `- ${title}\n  ${body}\n\n`);
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
  onEvent: ((event: AnalysisProgressEvent) => void) | undefined
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
  let lastProgress = 42;
  let thinkingStep = 0;

  const thinkingSteps = [
    {
      title: "Reading business context",
      body: "The model is checking the store profile, location, operating model, customer segments, and selected business goals."
    },
    {
      title: "Analyzing sales and cost structure",
      body: "The model is comparing revenue, rent, labor, ingredient cost, margin, and customer volume to understand the current operating baseline."
    },
    {
      title: "Diagnosing bottlenecks",
      body: "The model is looking for constraints such as underused hours, high fixed costs, weak retention, and menu or product complexity."
    },
    {
      title: "Evaluating expansion readiness",
      body: "The model is testing whether the business can support a second branch without overextending rent, staffing, or management capacity."
    },
    {
      title: "Drafting recommendations",
      body: "The model is converting the analysis into quick wins, operating improvements, strategic moves, marketing actions, and a roadmap."
    }
  ];

  const emitNextThinkingStep = () => {
    const step = thinkingSteps[Math.min(thinkingStep, thinkingSteps.length - 1)];
    if (thinkingStep < thinkingSteps.length) {
      emitThinking(onEvent, step.title, step.body);
      thinkingStep += 1;
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
        if (thinkingStep === 0 || rawText.length > thinkingStep * 2600) {
          emitNextThinkingStep();
        }
      }

      if (contentDelta) {
        content += contentDelta;
        if (!contentStarted) {
          contentStarted = true;
          emitThinking(
            onEvent,
            "Writing consultant report",
            "The model has finished its internal reasoning pass and is now composing the structured report fields."
          );
        }
      }

      const nextProgress = Math.min(84, 42 + Math.floor((content.length + rawText.length) / 900));
      if (nextProgress >= lastProgress + 4) {
        lastProgress = nextProgress;
        emitProgress(onEvent, nextProgress, reasoningSeen && !contentDelta ? "Thinking" : "Writing report", "The model is continuing the analysis and report generation.");
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

function endpointLabel(endpoint: string) {
  try {
    return new URL(endpoint).host;
  } catch {
    return "configured model endpoint";
  }
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
  emitProgress(onEvent, 5, "Reading Sales Record", "Required owner inputs, goals, sales evidence, and LLM configuration are being checked.");
  emitThinking(
    onEvent,
    "Reading uploaded business inputs",
    "The system is loading the owner profile, financial fields, selected goals, uploaded sales records, and supporting evidence."
  );

  const { provider, apiKey, endpoint, model } = configFromPayload(payload);
  if (!apiKey) {
    throw new Error("Real LLM mode requires an API key. Configure it in .env.local or the advanced settings panel.");
  }

  emitProgress(onEvent, 16, "Analyze your sales", `Using ${promptVersion} with ${payload.salesRecords.length} sales rows and ${payload.uploadedSources.length} uploaded source references.`);
  emitThinking(
    onEvent,
    "Building analysis baseline",
    "The system is calculating deterministic KPIs first, so the model can focus on diagnosis, expansion judgement, and action planning."
  );
  const fallbackShape = generateSimulatedReport({ ...payload, mode: "real" });
  const prompt = buildAnalysisPrompt(payload, fallbackShape);

  emitProgress(onEvent, 28, "Preparing LLM request", `Sending the structured analysis request to ${provider} (${model}) through ${endpointLabel(endpoint)}.`);
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
    emitProgress(onEvent, 92, "Completing with KPI engine", "The model connection did not finish in time, so the report is being completed with the deterministic KITSUNE analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model connection failed before a response was received: ${message}`);
  }

  emitProgress(onEvent, 42, "Thinking", `The model endpoint responded with HTTP ${response.status}; reading the streamed report payload now.`);
  if (!response.ok) {
    const rawText = await response.text();
    emitOutput(onEvent, "system", `- Model endpoint returned an error\n  HTTP ${response.status}. The system will continue with the deterministic KITSUNE KPI engine.\n\n`);
    emitProgress(onEvent, 92, "Completing with KPI engine", "The model endpoint returned an error, so the report is being completed with the deterministic KITSUNE analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model API request failed (${response.status}): ${rawText.slice(0, 220)}`);
  }

  const streamResult = await readStreamingModelResponse(response, onEvent);
  emitProgress(onEvent, 86, "Parsing LLM output", `Received ${streamResult.rawText.length.toLocaleString()} raw stream characters from the model.`);

  const text = streamResult.content;
  if (!text.trim()) {
    emitProgress(onEvent, 92, "Completing with KPI engine", "The model response did not contain assistant content, so the report is being completed with the deterministic KITSUNE analysis engine.");
    return fallbackAfterModelIssue(fallbackShape, payload, provider, model, "Model response did not contain assistant content.");
  }

  let parsed: Partial<FinalConsultantReport>;
  try {
    parsed = JSON.parse(extractJson(text)) as Partial<FinalConsultantReport>;
    parsed.visibleAnalysisLog?.slice(0, 5).forEach((item) => {
      const [title, ...rest] = item.split(":");
      emitThinking(onEvent, title.length > 8 && title.length < 70 ? title : "Model analysis note", rest.join(":").trim() || item);
    });
  } catch {
    emitProgress(onEvent, 90, "Repairing report JSON", "The model returned non-parseable JSON, so KITSUNE is asking the model to repair and complete the structured report.");
    emitThinking(
      onEvent,
      "Validating output structure",
      "The system is preserving the model's business analysis where possible while requiring a complete JSON object that the report UI can render."
    );

    try {
      const repairedText = await requestJsonRepair({ endpoint, apiKey, model, prompt, invalidText: text || streamResult.rawText });
      parsed = JSON.parse(extractJson(repairedText)) as Partial<FinalConsultantReport>;
      emitThinking(onEvent, "Recovered report JSON", "The model repaired the response into a valid report structure for final validation.");
    } catch (repairError) {
      const message = repairError instanceof Error ? repairError.message : "JSON repair failed.";
      emitProgress(onEvent, 92, "Completing with KPI engine", "The model returned invalid report JSON and repair failed, so the deterministic KITSUNE analysis engine is completing the report.");
      return fallbackAfterModelIssue(fallbackShape, payload, provider, model, `Model content was not valid report JSON: ${text.slice(0, 220)}; repair failed: ${message}`);
    }
  }

  emitProgress(onEvent, 92, "Validating report", "Normalizing the model report against the chart, KPI, roadmap, and expansion schema used by the UI.");
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

  emitProgress(onEvent, 100, "Opening report", "The final report has been validated and is ready for rendering.");
  return report;
}
