import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { CategoryDonut } from "@/components/charts/category-donut";
import { auth } from "@/auth";
import { getDashboardKpis, getCashflowSeries, getCategorySpendingCurrentMonth, getGoalsSummary, getDashboardAlerts, getMonthSummary } from "@/lib/data/dashboard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CreditCard } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo";
  const [kpis, cashflow, catSpend, goals, alerts, thisMonth, prevMonth] = await Promise.all([
    getDashboardKpis(userId),
    getCashflowSeries(userId, 12),
    getCategorySpendingCurrentMonth(userId),
    getGoalsSummary(userId, 3),
    getDashboardAlerts(userId),
    getMonthSummary(userId, new Date()),
    getMonthSummary(userId, new Date(new Date().setMonth(new Date().getMonth() - 1))),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your financial health</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <KpiCard title="Total Balance" value={formatCurrency(kpis.totalBalance)} trend="12.5%" trendDir="up" />
        <KpiCard title="Net Worth" value={formatCurrency(kpis.netWorth)} />
        <KpiCard
          title="Month Expense"
          value={formatCurrency(kpis.monthExpense)}
          trend={pct(prevMonth.monthExpense, thisMonth.monthExpense)}
          trendDir={thisMonth.monthExpense > prevMonth.monthExpense ? "down" : "up"}
        />
        <KpiCard
          title="Month Income"
          value={formatCurrency(kpis.monthIncome)}
          trend={pct(prevMonth.monthIncome, thisMonth.monthIncome)}
          trendDir={thisMonth.monthIncome >= prevMonth.monthIncome ? "up" : "down"}
        />
        <KpiCard title="Delta" value={formatCurrency(kpis.delta)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>12-Month Cashflow</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart data={cashflow} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {catSpend.length ? (
              <CategoryDonut data={catSpend.map((c) => ({ name: c.name, value: c.amount, color: c.color }))} />
            ) : (
              <div className="flex h-72 items-center justify-center">
                <Skeleton className="h-56 w-56 rounded-full" />
              </div>
            )}
            {catSpend.length ? (
              <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                {catSpend.map((c, i) => (
                  <LegendItem key={c.id} color={c.color} label={c.name} value={c.amount} index={i} />
                ))}
              </div>
          ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Goals Progress</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              name={g.name}
              due={g.due ? new Date(g.due).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : ""}
              saved={g.saved}
              total={g.total}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Alerts & Notifications</h2>
        <Card>
          <CardContent className="space-y-3 pt-6">
            {alerts.length ? (
              alerts.map((a) => (
                <AlertRow
                  key={a.id}
                  icon={a.level === "alert" ? <AlertCircle className="text-red-500" /> : <CreditCard className="text-amber-500" />}
                  title={a.title}
                  description={a.description}
                  action={<Badge variant={a.level === "alert" ? "destructive" : "outline"}>{a.level === "alert" ? "Alert" : "Review"}</Badge>}
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No alerts for now.</div>
            )}
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
            {trendDir === "down" ? "↓" : "↑"} {trend}
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

function pct(prev: number, curr: number) {
  if (!prev) return "";
  const change = ((curr - prev) / prev) * 100;
  return `${Math.abs(change).toFixed(1)}%`;
}

function LegendItem({ color, label, value, index = 0 }: { color?: string; label: string; value: number; index?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 rounded-sm"
          style={{ backgroundColor: color || ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)", "var(--chart-2)", "var(--chart-5)"][index % 5] }}
        />
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
