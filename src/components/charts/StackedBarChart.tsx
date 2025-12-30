"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type SeriesConfig = {
  key: string;
  color: string;
  label: string;
};

type StackedBarChartProps = {
  data: Record<string, string | number>[];
  series: SeriesConfig[];
  xKey: string;
};

export default function StackedBarChart({ data, series, xKey }: StackedBarChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={28} />
          <Tooltip />
          <Legend />
          {series.map((item) => (
            <Bar key={item.key} dataKey={item.key} stackId="a" fill={item.color} name={item.label} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
