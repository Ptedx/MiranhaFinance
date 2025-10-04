import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const budgets = [
  { name: "Food & Dining", spent: 850, budget: 1000 },
  { name: "Transportation", spent: 420, budget: 500 },
  { name: "Shopping", spent: 1250, budget: 800 },
  { name: "Bills & Utilities", spent: 1200, budget: 1500 },
  { name: "Entertainment", spent: 325, budget: 400 },
  { name: "Healthcare", spent: 150, budget: 300 },
];

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-muted-foreground">Track your spending against budgets</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b) => {
          const pct = Math.min(100, Math.round((b.spent / b.budget) * 100));
          return (
            <Card key={b.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{b.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex items-baseline justify-between">
                  <div className="text-sm text-muted-foreground">Spent</div>
                  <div className="text-sm font-medium">{formatCurrency(b.spent)}</div>
                </div>
                <Progress value={pct} />
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Budget: {formatCurrency(b.budget)}</div>
                  <div className={pct > 100 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>{pct}%</div>
                </div>
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

