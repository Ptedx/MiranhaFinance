import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddAccountDialog } from "./add-account";
import { AccountActionsMenu } from "./account-actions";
import { getUserAccounts } from "@/lib/data/accounts";
import { auth } from "@/auth";

export default async function AccountsPage() {
  const session = await auth();
  const userId = session?.user?.id as string;
  const accounts = await getUserAccounts(userId);
  const defaultCurrency = "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage all your financial accounts</p>
        </div>
        <AddAccountDialog defaultCurrency={defaultCurrency} />
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No accounts yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Get started by adding your first account.</p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-1 flex items-start justify-between">
                <CardTitle className="text-base">{a.name}</CardTitle>
                <AccountActionsMenu account={{ id: a.id, name: a.name, type: a.type as any, currency: a.currency, balance: a.balance, institution: a.institution || undefined }} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">{a.institution?.name || ""}</div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatCurrency(a.balance, a.currency)}
                </div>
                <div className="text-xs text-muted-foreground">{a.currency}</div>
                <div className="mt-4">
                  <Badge variant="outline">{accountTypeLabel(a.type)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

function formatCurrency(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function accountTypeLabel(t: string) {
  switch (t) {
    case "CHECKING":
      return "Checking";
    case "SAVINGS":
      return "Savings";
    case "CREDIT_CARD":
      return "Credit Card";
    case "BROKERAGE":
      return "Brokerage";
    case "CRYPTO":
      return "Crypto";
    default:
      return t;
  }
}
