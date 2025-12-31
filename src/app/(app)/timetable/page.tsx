"use client";

import { useEffect, useState } from "react";

import TimetableClient from "@/app/(app)/timetable/TimetableClient";
import { apiFetch } from "@/lib/api";
import { timeStringToMinutes } from "@/lib/time";

type BlockView = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  category: string;
  mandatory: boolean;
};

export default function TimetablePage() {
  const [blocks, setBlocks] = useState<BlockView[]>([]);

  useEffect(() => {
    const load = async () => {
      const payload = await apiFetch<{ blocks: BlockView[] }>("/blocks");
      setBlocks(payload.blocks ?? []);
    };
    load().catch(() => null);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Timetable</p>
        <h1 className="text-3xl font-semibold">Daily blocks</h1>
        <p className="text-sm text-muted">
          Adjust your day structure. Keep it simple and consistent.
        </p>
      </div>
      <TimetableClient
        blocks={blocks.map((block) => ({
          id: block.id,
          name: block.name,
          startTime: timeStringToMinutes(block.start_time),
          endTime: timeStringToMinutes(block.end_time),
          category: block.category,
          mandatory: block.mandatory,
        }))}
      />
    </div>
  );
}
