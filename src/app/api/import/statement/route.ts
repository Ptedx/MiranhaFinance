import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { Prisma, TxnStatus } from "@prisma/client";
import { ensureUserCategories } from "@/lib/data/categories";
import { normalizeDesc, parseCsvStatement, parsePdfStatement, parsePdfWithOcr, guessCategory, ParsedTxn, CsvColumnMap } from "@/lib/import/statement";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const mapRaw = form.get("columnMap") as string | null;
  const columnMap: CsvColumnMap | undefined = mapRaw ? JSON.parse(mapRaw) : undefined;
  const defaultAccountId = (form.get("defaultAccountId") as string) || undefined;
  const accountType = (form.get("accountType") as string | null) || null;
  const useOcr = String(form.get("useOcr") || "").toLowerCase() === "true";

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  const isCsv = name.endsWith(".csv") || mime === "text/csv" || mime === "application/vnd.ms-excel";
  const isPdf = name.endsWith(".pdf") || mime === "application/pdf";
  if (!isCsv && !isPdf) return NextResponse.json({ error: "Only CSV or PDF files are allowed" }, { status: 400 });
  let txns: ParsedTxn[] = [];
  try {
    if (isCsv) {
      txns = parseCsvStatement(buf.toString("utf8"), columnMap);
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

  if (!txns.length) return NextResponse.json({ error: "No rows detected" }, { status: 400 });

  // load user accounts and categories
  const [accounts, categories] = await Promise.all([
    prisma.finAccount.findMany({ where: { userId, deletedAt: null, ...(accountType ? { type: accountType as any } : {}) } }),
    (async () => { await ensureUserCategories(userId); return prisma.category.findMany({ where: { userId } }); })(),
  ]);

  if (!accounts.length) return NextResponse.json({ error: "No accounts found" }, { status: 400 });

  const catsByName = new Map(categories.map((c) => [c.name.toLowerCase(), c] as const));
  const others = categories.find((c) => c.name.toLowerCase() === "others");
  const keywords: Record<string, string> = {
    uber: "Transport",
    ifood: "Food",
    grocery: "Food",
    supermercado: "Food",
    netflix: "Entertainment",
    spotify: "Entertainment",
    amazon: "Shopping",
    farmacia: "Health",
    hospital: "Health",
    energia: "Bills",
    electricity: "Bills",
    water: "Bills",
    salary: "Income",
    deposito: "Income",
    transferencia: "Transfer",
  };

  // Simple account inference by currency or name hint
  function inferAccount(t: ParsedTxn) {
    if (defaultAccountId) {
      const explicit = accounts.find((a) => a.id === defaultAccountId);
      if (explicit) return explicit;
    }
    if (accounts.length === 1) return accounts[0];
    if (t.accountNameHint) {
      const hit = accounts.find((a) => a.name.toLowerCase().includes(String(t.accountNameHint).toLowerCase()));
      if (hit) return hit;
    }
    if (t.currency) {
      const sameCurr = accounts.filter((a) => a.currency === t.currency);
      if (sameCurr.length === 1) return sameCurr[0];
    }
    return accounts[0];
  }

  function inferCategory(desc: string) {
    const g = guessCategory(desc, keywords);
    if (g && catsByName.get(g.toLowerCase())) return catsByName.get(g.toLowerCase())!;
    return others || categories[0];
  }

  let inserted = 0;
  let skipped = 0;

  try {
    await prisma.$transaction(async (tx) => {
      // Track balance increment per account
      const deltaByAccount = new Map<string, Prisma.Decimal>();

      for (const row of txns) {
        const acc = inferAccount(row);
        const cat = inferCategory(row.description);
        const currency = row.currency || acc.currency;
        const dec = new Prisma.Decimal(row.amount);
        const desc = normalizeDesc(row.description);

        const baseDate = new Date(row.date);
        const exists = await tx.transaction.findFirst({
          where: {
            userId,
            accountId: acc.id,
            date: { gte: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), lte: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) },
            currency,
            description: desc,
            amount: dec,
            deletedAt: null,
          },
        });
        if (exists) { skipped++; continue; }

        await tx.transaction.create({
          data: {
            userId,
            accountId: acc.id,
            date: new Date(row.date),
            amount: dec,
            currency,
            description: desc,
            status: row.status || TxnStatus.POSTED,
            categoryId: cat?.id,
            tags: [],
          },
        });
        inserted++;

        if ((row.status || TxnStatus.POSTED) === TxnStatus.POSTED) {
          const prev = deltaByAccount.get(acc.id) || new Prisma.Decimal(0);
          deltaByAccount.set(acc.id, prev.add(dec));
        }
      }

      // Apply balance increments
      for (const [accId, delta] of deltaByAccount) {
        await tx.finAccount.update({ where: { id: accId }, data: { balance: { increment: delta } as any } });
      }
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }

  return NextResponse.json({ inserted, skipped });
}
