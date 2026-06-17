import { NextResponse } from "next/server";
import { createDemoTemplate } from "@/lib/demo-template";

export function GET() {
  return NextResponse.json(createDemoTemplate());
}
