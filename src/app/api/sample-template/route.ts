import { NextResponse } from "next/server";
import { createSampleTemplate } from "@/lib/sample-template";

export function GET() {
  return NextResponse.json(createSampleTemplate());
}
