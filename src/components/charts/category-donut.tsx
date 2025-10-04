"use client";

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip as ReTooltip } from "recharts";

type Slice = { name: string; value: number; color?: string };

export function CategoryDonut({ data }: { data: Slice[] }) {
  const palette = [
    "var(--chart-1)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-2)",
    "var(--chart-5)",
    "#94a3b8",
  ];
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ReTooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={100}
            stroke="hsl(var(--border))"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || palette[index % palette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

