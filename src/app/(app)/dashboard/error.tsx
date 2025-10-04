"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error() {
  return (
    <Card>
      <CardHeader><CardTitle>Something went wrong</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">We couldn’t load your dashboard data. Try again later.</p>
      </CardContent>
    </Card>
  );
}

