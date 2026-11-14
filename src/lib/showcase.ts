export const projectRepositoryUrl = "https://github.com/zjmdong/Kitsune_Project";
export const showcaseMessage = "The analysis workspace is temporarily unavailable. Visit GitHub to explore the project.";

export function isShowcaseOnly() {
  const setting = process.env.KITSUNE_SHOWCASE_ONLY;
  if (setting === "true") return true;
  if (setting === "false") return false;

  // Public builds stay closed unless the operator explicitly enables the workspace.
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

export function showcaseUnavailableResponse() {
  if (!isShowcaseOnly()) return undefined;

  return Response.json(
    { error: showcaseMessage, code: "SHOWCASE_ONLY", repository: projectRepositoryUrl },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
