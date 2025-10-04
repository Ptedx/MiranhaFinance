import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-2 h-28 w-28 rounded-full bg-muted flex items-center justify-center">
            <PiggySvg className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground">
            We couldn&apos;t find the page you&apos;re looking for. It may have been moved or deleted.
          </p>
          <div>
            <Button asChild>
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PiggySvg({ className }: { className?: string }) {
  // Simple inline SVG, colors adapt to theme tokens
  return (
    <svg viewBox="0 0 128 128" className={className} aria-hidden>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-2)" />
          <stop offset="100%" stopColor="var(--chart-1)" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 75c0-22 18-35 42-35 17 0 28 6 34 18 7 1 12 6 12 13 0 4-2 8-5 10l-2 10-11-4a43 43 0 0 1-15 3H56c-16 0-26-6-32-15l-9 3 3-10c-2-2-4-6-4-11z" fill="url(#g1)" stroke="hsl(var(--border))" strokeWidth="2"/>
        <circle cx="88" cy="72" r="4" fill="hsl(var(--text-primary))" />
        <path d="M64 48c-3 0-6-2-6-5s3-5 6-5 6 2 6 5-3 5-6 5z" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
        <path d="M42 74h10" stroke="hsl(var(--card))" strokeWidth="4"/>
      </g>
    </svg>
  );
}

