import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isShowcaseOnly } from "@/lib/showcase";

export const dynamic = "force-dynamic";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  if (isShowcaseOnly()) redirect("/maintenance");
  return children;
}
