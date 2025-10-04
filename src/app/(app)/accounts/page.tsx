import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const demo = [
  { name: "Checking Account", bank: "Chase Bank", amount: 12450.5, tag: "Checking" },
  { name: "Savings Account", bank: "Bank of America", amount: 28900, tag: "Savings" },
  { name: "Credit Card", bank: "American Express", amount: -1250.75, tag: "Credit" },
  { name: "Investment Account", bank: "Fidelity", amount: 45231.89, tag: "Investment" },
  { name: "Cash", bank: "", amount: 350, tag: "Cash" },
];

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">Manage all your financial accounts</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demo.map((a) => (
          <Card key={a.name}>
            <CardHeader className="pb-1">
              <CardTitle className="text-base">{a.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground">{a.bank || ""}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">
                {formatCurrency(a.amount)}
              </div>
              <div className="text-xs text-muted-foreground">USD</div>
              <div className="mt-4">
                <Badge variant="outline">{a.tag}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
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
