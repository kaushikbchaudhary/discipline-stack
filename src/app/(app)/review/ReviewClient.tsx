"use client";

import { useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { saveWeeklyReview } from "@/app/(app)/review/actions";

type ReviewClientProps = {
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
  q4?: string | null;
  stopDoing?: string | null;
  resistanceBlock?: string | null;
  locked: boolean;
  insights: {
    missedByCategory: Record<string, number>;
    mostSkippedHour: number;
    trend: string;
    mostSkippedReason: string;
  };
  timeReality: {
    plannedMinutes: number;
    executedMinutes: number;
    recoveredMinutes: number;
  };
};

export default function ReviewClient({
  q1,
  q2,
  q3,
  q4,
  stopDoing,
  resistanceBlock,
  locked,
  insights,
  timeReality,
}: ReviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveWeeklyReview(formData);
      if (result.ok) {
        toast.success("Weekly review saved.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not save.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold">Weekly insights</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p>Consistency trend: {insights.trend}</p>
          <p>Most skipped hour: {String(insights.mostSkippedHour).padStart(2, "0")}:00</p>
          <p>
            Most skipped due to: {insights.mostSkippedReason || "Not enough data"}
          </p>
          <div>
            Missed blocks by category:
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {Object.entries(insights.missedByCategory).length === 0 ? (
                <span className="chip text-muted">No missed mandatory blocks</span>
              ) : (
                Object.entries(insights.missedByCategory).map(([category, count]) => (
                  <span key={category} className="chip text-muted">
                    {category}: {count}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Time reality check</h2>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p>Planned time: {timeReality.plannedMinutes} minutes</p>
          <p>Executed time: {timeReality.executedMinutes} minutes</p>
          <p>Recovered time: {timeReality.recoveredMinutes} minutes</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4 p-6">
      <div>
        <label className="text-sm font-medium">What moved me closer to income?</label>
        <textarea
          name="q1"
          defaultValue={q1 ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What output did I create?</label>
        <textarea
          name="q2"
          defaultValue={q2 ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Where did I overthink?</label>
        <textarea
          name="q3"
          defaultValue={q3 ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What do I remove next week?</label>
        <textarea
          name="q4"
          defaultValue={q4 ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What should I STOP doing next week?</label>
        <textarea
          name="stopDoing"
          defaultValue={stopDoing ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What block caused the most resistance?</label>
        <textarea
          name="resistanceBlock"
          defaultValue={resistanceBlock ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || locked}
        className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        {locked ? "Review locked" : "Save review"}
      </button>
      </form>
    </div>
  );
}
