import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { auth } from "@/auth";
import { getDashboardKpis } from "@/lib/data/dashboard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CreditCard } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo";
  const kpis = await getDashboardKpis(userId);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your financial health</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard title="Total Balance" value={formatCurrency(kpis.totalBalance)} trend="12.5%" trendDir="up" />
        <KpiCard title="Net Worth" value={formatCurrency(kpis.netWorth)} trend="8.2%" trendDir="up" />
        <KpiCard title="Month Expense" value={formatCurrency(kpis.monthExpense)} trend="5.3%" trendDir="down" />
        <KpiCard title="Month Income" value={formatCurrency(kpis.monthIncome)} trend="3.1%" trendDir="up" />
        <KpiCard title="Delta" value={formatCurrency(kpis.delta)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>12-Month Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-center justify-center">
              <Skeleton className="h-56 w-56 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <LegendItem color="bg-emerald-500" label="Food" value={850} />
              <LegendItem color="bg-blue-500" label="Transport" value={420} />
              <LegendItem color="bg-amber-500" label="Shopping" value={650} />
              <LegendItem color="bg-slate-400" label="Bills" value={1200} />
              <LegendItem color="bg-slate-500" label="Other" value={325} />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Goals Progress</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GoalCard name="Emergency Fund" due="Dec 2024" saved={8500} total={10000} />
          <GoalCard name="Vacation" due="Jun 2025" saved={2300} total={5000} />
          <GoalCard name="New Car" due="Dec 2025" saved={12000} total={25000} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Alerts & Notifications</h2>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <AlertRow
              icon={<AlertCircle className="text-red-500" />}
              title="Shopping budget exceeded"
              description={`You've spent ${formatCurrency(1250)} of your ${formatCurrency(800)} budget`}
              action={<Badge variant="destructive">Alert</Badge>}
            />
            <AlertRow
              icon={<CreditCard className="text-amber-500" />}
              title="Large transaction detected"
              description={`${formatCurrency(2500)} payment to Best Electronics`}
              action={<Badge variant="outline">Review</Badge>}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ title, value, trend, trendDir }: { title: string; value: string; trend?: string; trendDir?: "up" | "down" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">USD</div>
        {trend ? (
          <div className={trendDir === "down" ? "text-xs text-red-600 dark:text-red-400" : "text-xs text-emerald-600 dark:text-emerald-400"}>
            {trendDir === "down" ? "↓ " : "↑ "}
            {trend}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className={`inline-block size-2.5 rounded-sm ${color}`} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function GoalCard({ name, due, saved, total }: { name: string; due: string; saved: number; total: number }) {
  const pct = Math.round((saved / total) * 100);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex-1">{name}</CardTitle>
        <CardAction>
          <Badge variant="outline">{due}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="text-2xl font-semibold">{formatCurrency(saved)}</div>
        <div className="text-sm text-muted-foreground">of {formatCurrency(total)}</div>
        <Progress value={pct} />
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">{formatCurrency(total - saved)} remaining</div>
          <div className="text-emerald-600 dark:text-emerald-400">{pct}%</div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between rounded-lg border bg-background px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
      </div>
      <div className="self-center">{action}</div>
    </div>
  );
}
