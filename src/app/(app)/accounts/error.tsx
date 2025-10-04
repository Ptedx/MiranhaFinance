"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error() {
  return (
    <Card>
      <CardHeader><CardTitle>Failed to load accounts</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Please refresh the page.</p>
      </CardContent>
    </Card>
  );
}

