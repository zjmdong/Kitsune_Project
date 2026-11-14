import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as analyze } from "@/app/api/analyze/route";
import { POST as stream } from "@/app/api/analyze/stream/route";
import { POST as consultant } from "@/app/api/consultant-report/route";
import WorkspaceLayout from "@/app/workspace/layout";
import { runRealAnalysis } from "../analysis-server";
import { createDefaultPayload } from "../workflow";
import { isShowcaseOnly, projectRepositoryUrl, showcaseUnavailableResponse } from "../showcase";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); }
}));

beforeEach(() => {
  vi.stubEnv("KITSUNE_SHOWCASE_ONLY", "");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("showcase defaults", () => {
  it("closes production builds without additional configuration", () => {
    expect(isShowcaseOnly()).toBe(true);
  });

  it("keeps Vercel closed even with a non-production NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "1");
    expect(isShowcaseOnly()).toBe(true);
  });

  it("preserves the local development workflow", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isShowcaseOnly()).toBe(false);
    expect(showcaseUnavailableResponse()).toBeUndefined();
    expect(WorkspaceLayout({ children: "workspace" })).toBe("workspace");
  });

  it("allows a local maintenance preview", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("KITSUNE_SHOWCASE_ONLY", "true");
    expect(isShowcaseOnly()).toBe(true);
  });

  it("requires an exact false value to enable a private production workspace", () => {
    vi.stubEnv("KITSUNE_SHOWCASE_ONLY", "flase");
    expect(isShowcaseOnly()).toBe(true);
    vi.stubEnv("KITSUNE_SHOWCASE_ONLY", "false");
    expect(isShowcaseOnly()).toBe(false);
  });

  it("redirects the workspace on the server", () => {
    expect(() => WorkspaceLayout({ children: "workspace" })).toThrow("REDIRECT:/maintenance");
  });
});

describe("model access protection", () => {
  const routes = [
    ["/api/analyze", analyze],
    ["/api/analyze/stream", stream],
    ["/api/consultant-report", consultant]
  ] as const;

  it.each(routes)("blocks %s before parsing input or contacting a provider", async (path, handler) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const request = new Request(`http://localhost${path}?KITSUNE_SHOWCASE_ONLY=false`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-middleware-subrequest": "middleware" },
      body: "not-json"
    });
    const response = await handler(request);
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ code: "SHOWCASE_ONLY", repository: projectRepositoryUrl });
    expect(request.bodyUsed).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("also blocks direct calls to the model orchestration function", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(runRealAnalysis(createDefaultPayload())).rejects.toThrow("temporarily unavailable");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
