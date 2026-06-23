import { NextResponse } from "next/server";
import { runDrugDiscovery } from "@/app/lib/drug-generator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const disease = searchParams.get("disease")?.trim();

  if (!disease) {
    return NextResponse.json(
      { error: "Missing required query parameter: disease" },
      { status: 400 }
    );
  }

  try {
    const result = await runDrugDiscovery(disease, new URL(request.url).origin);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Drug discovery failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
