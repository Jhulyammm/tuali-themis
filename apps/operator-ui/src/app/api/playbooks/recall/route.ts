/**
 * POST /api/playbooks/recall — Knowledge Graph query
 *
 * Body: { source_site?: string, destination_site?: string }
 * Returns: mappings previamente aprendidos que matchean.
 *
 * Esto es el momento del "ya vi este mapeo antes" en el demo Paso 5b.
 */

import { NextRequest, NextResponse } from "next/server";
import { recallSimilarMappings } from "@hack4her/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const query = (await request.json()) as {
      source_site?: string;
      destination_site?: string;
    };
    const results = await recallSimilarMappings(query);
    const totalMatches = results.reduce(
      (acc, r) => acc + r.matches.length,
      0,
    );
    return NextResponse.json({
      results,
      total_matches: totalMatches,
      total_playbooks_consulted: results.length,
    });
  } catch (err) {
    console.error("[/api/playbooks/recall]", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
