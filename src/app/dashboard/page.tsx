import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { auth } from "@/auth";
import { getDashboardKpis } from "@/lib/data/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "demo";
  const kpis = await getDashboardKpis(userId);
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Total Balance" value={formatCurrency(kpis.totalBalance)} trend="" />
        <KpiCard title="Net Worth" value={formatCurrency(kpis.netWorth)} trend="" />
        <KpiCard title="Month Income" value={formatCurrency(kpis.monthIncome)} />
        <KpiCard title="Month Expense" value={formatCurrency(kpis.monthExpense)} />
        <KpiCard title="Delta" value={formatCurrency(kpis.delta)} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cashflow (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <CashflowChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories (Donut)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-center justify-center">
              <Skeleton className="h-56 w-56 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ title, value, trend }: { title: string; value: string; trend?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {trend ? <div className="text-xs text-emerald-600 dark:text-emerald-400">{trend}</div> : null}
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
