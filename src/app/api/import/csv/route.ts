import { NextResponse } from "next/server";
import { z } from "zod";

const rowSchema = z.record(z.any());
const schema = z.object({ rows: z.array(rowSchema).max(5000) });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rows } = schema.parse(body);
    // Skeleton: just validate and echo count for now.
    return NextResponse.json({ count: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bad request" }, { status: 400 });
  }
}

