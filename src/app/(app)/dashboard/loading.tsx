import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground"><Skeleton className="h-4 w-24" /></CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-6 w-28" />
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><Skeleton className="h-5 w-40" /></CardTitle></CardHeader>
          <CardContent><Skeleton className="h-72 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Skeleton className="h-5 w-40" /></CardTitle></CardHeader>
          <CardContent><div className="flex h-72 items-center justify-center"><Skeleton className="h-56 w-56 rounded-full" /></div></CardContent>
        </Card>
      </section>
    </div>
  );
}

