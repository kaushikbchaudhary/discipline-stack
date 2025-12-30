"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type SimpleBarChartProps = {
  data: Record<string, string | number>[];
  xKey: string;
  barKey: string;
  color: string;
};

export default function SimpleBarChart({ data, xKey, barKey, color }: SimpleBarChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} />
          <Tooltip />
          <Bar dataKey={barKey} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
