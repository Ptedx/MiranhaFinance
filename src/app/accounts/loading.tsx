import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-5 w-40" /></CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

