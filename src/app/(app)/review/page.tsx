"use client";

import { useEffect, useState } from "react";

import { getWeekStart } from "@/lib/time";
import ReviewClient from "@/app/(app)/review/ReviewClient";
import { apiFetch } from "@/lib/api";

type Review = {
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  stop_doing?: string | null;
  resistance_block?: string | null;
};

export default function ReviewPage() {
  const [review, setReview] = useState<Review | null>(null);
  const weekStartDate = getWeekStart(new Date()).toISOString().slice(0, 10);

  useEffect(() => {
    const load = async () => {
      const payload = await apiFetch<{ review: Review | null }>(
        `/review?weekStart=${weekStartDate}`,
      );
      setReview(payload.review);
    };
    load().catch(() => null);
  }, [weekStartDate]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Weekly review</p>
        <h1 className="text-3xl font-semibold">Sunday reset</h1>
        <p className="text-sm text-muted">Capture lessons and remove noise for next week.</p>
      </div>
      <ReviewClient
        q1={review?.q1}
        q2={review?.q2}
        q3={review?.q3}
        q4={review?.q4}
        stopDoing={review?.stop_doing}
        resistanceBlock={review?.resistance_block}
        locked={Boolean(review)}
      />
    </div>
  );
}
