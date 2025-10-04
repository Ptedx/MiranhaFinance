import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Accounts CRUD will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

