import { NextResponse } from "next/server";
import { createPresetSampleTemplate } from "@/lib/sample-template";

export function GET() {
  return NextResponse.json(createPresetSampleTemplate());
}
