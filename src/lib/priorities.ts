import type { FinalConsultantReport, PriorityHighlight, PriorityHighlightKey, PriorityHighlights } from "./types";

type PrioritySection = {
  key: PriorityHighlightKey;
  label: string;
  items: string[];
};

const impactSignals = [
  { keyword: "profit", weight: 18 },
  { keyword: "margin", weight: 17 },
  { keyword: "revenue", weight: 16 },
  { keyword: "cost", weight: 15 },
  { keyword: "waste", weight: 14 },
  { keyword: "rent", weight: 13 },
  { keyword: "payback", weight: 13 },
  { keyword: "leak", weight: 12 },
  { keyword: "pricing", weight: 12 },
  { keyword: "labor", weight: 11 },
  { keyword: "staff", weight: 11 },
  { keyword: "risk", weight: 10 },
  { keyword: "conversion", weight: 9 },
  { keyword: "customer", weight: 8 },
  { keyword: "traffic", weight: 8 },
  { keyword: "inventory", weight: 7 }
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim();
}

function sectionItems(report: FinalConsultantReport): PrioritySection[] {
  return [
    { key: "keyInsights", label: "key insights", items: report.keyInsights },
    { key: "problemDiagnosis", label: "problem diagnosis", items: report.problemDiagnosis },
    { key: "bottleneckAnalysis", label: "bottleneck analysis", items: report.consultingAnalysis.bottleneckAnalysis },
    {
      key: "profitLeakageBenchmarking",
      label: "profit leakage and benchmarking",
      items: [...report.consultingAnalysis.profitLeakageAnalysis, ...report.consultingAnalysis.benchmarking]
    },
    { key: "scenarioSimulation", label: "scenario simulation", items: report.consultingAnalysis.scenarioSimulation },
    { key: "quickWins", label: "quick wins", items: report.recommendations.quickWins },
    { key: "operationalImprovements", label: "operational improvements", items: report.recommendations.operationalImprovements },
    { key: "strategicMoves", label: "strategic moves", items: report.recommendations.strategicMoves },
    { key: "marketingCampaigns", label: "marketing campaigns", items: report.marketingStrategy.campaigns },
    { key: "socialPosts", label: "social posts", items: report.marketingStrategy.socialPosts },
    { key: "roadmapNow", label: "roadmap 0-7 days", items: report.actionPlanRoadmap.now },
    { key: "roadmapNext30Days", label: "roadmap 7-30 days", items: report.actionPlanRoadmap.next30Days },
    { key: "roadmapNext3Months", label: "roadmap 1-3 months", items: report.actionPlanRoadmap.next3Months },
    { key: "roadmapNext12Months", label: "roadmap 3-12 months", items: report.actionPlanRoadmap.next12Months }
  ];
}

export function selectTopPriority(items: string[], section: string): PriorityHighlight | undefined {
  if (!items.length) return undefined;

  const scoredItems = items.map((item, index) => {
    const lower = `${section} ${item}`.toLowerCase();
    const impactScore = impactSignals.reduce((score, signal) => score + (lower.includes(signal.keyword) ? signal.weight : 0), 0);
    const positionScore = Math.max(0, 6 - index);

    return {
      item,
      score: impactScore + positionScore
    };
  });

  const winner = scoredItems.slice().sort((a, b) => b.score - a.score)[0];
  return {
    item: winner.item,
    reason: "Selected as the highest-impact item by the fallback scoring engine."
  };
}

function matchExistingItem(candidate: string | undefined, items: string[]) {
  if (!candidate) return undefined;
  const normalizedCandidate = normalizeText(candidate);
  return items.find((item) => {
    const normalizedItem = normalizeText(item);
    return normalizedItem === normalizedCandidate || normalizedItem.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedItem);
  });
}

export function isPriorityItem(item: string, highlight?: PriorityHighlight) {
  if (!highlight?.item) return false;
  return normalizeText(item) === normalizeText(highlight.item);
}

export function buildPriorityHighlights(report: FinalConsultantReport): PriorityHighlights {
  return Object.fromEntries(
    sectionItems(report)
      .map((section) => [section.key, selectTopPriority(section.items, section.label)] as const)
      .filter((entry): entry is [PriorityHighlightKey, PriorityHighlight] => Boolean(entry[1]))
  );
}

export function normalizePriorityHighlights(report: FinalConsultantReport, modelHighlights?: PriorityHighlights): PriorityHighlights {
  const fallbackHighlights = buildPriorityHighlights(report);
  const normalized: PriorityHighlights = { ...fallbackHighlights };

  for (const section of sectionItems(report)) {
    const modelHighlight = modelHighlights?.[section.key];
    const matchedItem = matchExistingItem(modelHighlight?.item, section.items);
    if (matchedItem) {
      normalized[section.key] = {
        item: matchedItem,
        reason: modelHighlight?.reason?.trim() || "Selected by the LLM as the highest-impact business priority for this section."
      };
    }
  }

  return normalized;
}
