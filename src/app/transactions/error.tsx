"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error() {
  return (
    <Card>
      <CardHeader><CardTitle>Failed to load transactions</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Please try again later.</p>
      </CardContent>
    </Card>
  );
}

