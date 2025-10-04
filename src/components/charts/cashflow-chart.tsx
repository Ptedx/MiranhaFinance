"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { month: string; income: number; expense: number };

const sample: Point[] = [
  { month: "Jan", income: 5200, expense: 4100 },
  { month: "Feb", income: 4900, expense: 3800 },
  { month: "Mar", income: 5300, expense: 4200 },
  { month: "Apr", income: 5100, expense: 4400 },
  { month: "May", income: 5500, expense: 4600 },
  { month: "Jun", income: 5600, expense: 4700 },
];

export function CashflowChart({ data = sample }: { data?: Point[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={48} />
          <ReTooltip
            contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />
          <Area type="monotone" dataKey="income" stroke="var(--chart-1)" fill="url(#income)" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" stroke="var(--chart-5)" fill="url(#expense)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

