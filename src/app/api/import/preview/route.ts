import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { ensureUserCategories } from "@/lib/data/categories";
import { parseCsvStatement, parsePdfStatement, parsePdfWithOcr, normalizeDesc, CsvColumnMap, detectCsvColumnMap } from "@/lib/import/statement";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const form = await req.formData();
  const file = form.get("file");
  const mapRaw = form.get("columnMap") as string | null;
  const columnMap: CsvColumnMap | undefined = mapRaw ? JSON.parse(mapRaw) : undefined;
  const useOcr = String(form.get("useOcr") || "").toLowerCase() === "true";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  const isCsv = name.endsWith(".csv") || mime === "text/csv" || mime === "application/vnd.ms-excel";
  const isPdf = name.endsWith(".pdf") || mime === "application/pdf";
  if (!isCsv && !isPdf) return NextResponse.json({ error: "Only CSV or PDF files are allowed" }, { status: 400 });
  let txns: { date: Date; description: string; amount: number; currency?: string; status?: "PENDING" | "POSTED" }[] = [];
  let columns: string[] = [];
  try {
    if (isCsv) {
      const text = buf.toString("utf8");
      // header extraction (first line)
      columns = (text.split(/\r?\n/, 1)[0] || "").split(/,|;|\t/).map((s) => s.trim()).filter(Boolean);
      const autoMap = columnMap || detectCsvColumnMap(columns);
      txns = parseCsvStatement(text, autoMap);
    } else if (isPdf) {
      try {
        txns = await parsePdfStatement(buf);
      } catch (e) {
        if (useOcr) {
          txns = await parsePdfWithOcr(buf);
        } else throw e;
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Parse error" }, { status: 400 });
  }

  await ensureUserCategories(userId);
  const accountType = (form.get("accountType") as string | null) || null;
  const accounts = await prisma.finAccount.findMany({ where: { userId, deletedAt: null, ...(accountType ? { type: accountType as any } : {}) }, select: { id: true, name: true, currency: true, type: true } });

  const previewRows = txns.slice(0, 20);
  // Duplicate check for preview rows only (±2 days tolerance)
  let dupCount = 0;
  for (const row of previewRows) {
    const exists = await prisma.transaction.findFirst({
      where: {
        userId,
        date: { gte: new Date(row.date.getTime() - 2 * 24 * 60 * 60 * 1000), lte: new Date(row.date.getTime() + 2 * 24 * 60 * 60 * 1000) },
        amount: Number(row.amount),
        description: normalizeDesc(row.description),
      },
      select: { id: true },
    });
    if (exists) dupCount++;
  }

  return NextResponse.json({
    totalRows: txns.length,
    preview: previewRows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      description: r.description,
      amount: r.amount,
      currency: r.currency || accounts[0]?.currency || "USD",
      status: r.status || "POSTED",
    })),
    dupPreviewCount: dupCount,
    columns,
    detectedMap: columnMap || null,
  });
}
