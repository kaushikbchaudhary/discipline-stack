"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = {
  complete: "#2f5d62",
  incomplete: "#b7b0a5",
  failure: "#b86045",
};

type ExecutionRingProps = {
  complete: number;
  incomplete: number;
  failure: number;
};

export default function ExecutionRing({ complete, incomplete, failure }: ExecutionRingProps) {
  const data = [
    { name: "Complete", value: complete, key: "complete" },
    { name: "Incomplete", value: incomplete, key: "incomplete" },
    { name: "Failure", value: failure, key: "failure" },
  ];

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={65}
            outerRadius={90}
            stroke="none"
            isAnimationActive
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
