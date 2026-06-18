import { NextResponse } from "next/server";
import { createMockConsultantReport } from "@/lib/report";
import type { AnalysisResult, BusinessProfile, ConsultantReport, LocationRecommendation } from "@/lib/types";

type RequestBody = {
  profile: BusinessProfile;
  analysis: AnalysisResult;
  locations: LocationRecommendation[];
};

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

async function createLiveReport(body: RequestBody): Promise<ConsultantReport | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  const baseUrl = process.env.AI_API_BASE_URL ?? "https://api.openai.com/v1";
  const fallback = createMockConsultantReport(body.profile, body.analysis, body.locations);
  const compactPayload = {
    profile: body.profile,
    analysis: {
      grossMargin: body.analysis.grossMargin,
      estimatedMonthlyRevenue: body.analysis.estimatedMonthlyRevenue,
      estimatedMonthlyProfit: body.analysis.estimatedMonthlyProfit,
      revenueTrend: body.analysis.revenueTrend,
      peakHour: body.analysis.peakHour,
      bestProducts: body.analysis.bestProducts.slice(0, 3),
      risks: body.analysis.operatingRisks
    },
    topLocations: body.locations.slice(0, 3)
  };

  const prompt = `You are KITSUNE, an AI business analyst for Hong Kong SME restaurant owners.
Return only valid JSON matching this TypeScript shape:
{
  "diagnosis": "string",
  "keyInsights": ["string"],
  "recommendations": ["string"],
  "expectedImpact": ["string"],
  "first90Days": ["string"],
  "marketingPlan": {
    "positioning": "string",
    "socialPosts": ["string"],
    "campaigns": ["string"],
    "loyaltyProgram": "string",
    "seasonalCalendar": ["string"]
  },
  "designBrief": {
    "palette": [{"name":"string","hex":"#000000"}],
    "interiorStyle": "string",
    "moodboardPrompt": "string",
    "storefrontNotes": ["string"]
  },
  "disclaimer": "string"
}
Use practical, investor-safe language. Do not claim legal or investment certainty.
Business payload:
${JSON.stringify(compactPayload, null, 2)}`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: 0.25
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
    };
    const text =
      data.output_text ??
      data.output?.flatMap((item) => item.content ?? []).map((content) => content.text ?? "").join("\n") ??
      "";
    const parsed = JSON.parse(extractJson(text)) as Omit<ConsultantReport, "mode">;

    return {
      ...fallback,
      ...parsed,
      mode: "live"
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;
  const live = await createLiveReport(body);
  const report = live ?? createMockConsultantReport(body.profile, body.analysis, body.locations);

  return NextResponse.json(report);
}
