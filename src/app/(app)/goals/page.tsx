import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const goals = [
  { name: "Emergency Fund", saved: 8500, total: 10000, due: "Dec 2024" },
  { name: "Vacation Fund", saved: 2300, total: 5000, due: "Jun 2025" },
  { name: "New Car", saved: 12000, total: 25000, due: "Dec 2025" },
  { name: "Home Down Payment", saved: 35000, total: 50000, due: "Dec 2026" },
  { name: "Debt Payoff", saved: 7500, total: 15000, due: "Mar 2025" },
];

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
        <p className="text-muted-foreground">Track your financial goals and progress</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.total) * 100);
          return (
            <Card key={g.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{g.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="text-2xl font-semibold">{formatCurrency(g.saved)}</div>
                <div className="text-sm text-muted-foreground">of {formatCurrency(g.total)} • {g.due}</div>
                <Progress value={pct} />
                <div className="text-sm text-muted-foreground">{formatCurrency(g.total - g.saved)} remaining</div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function formatCurrency(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

