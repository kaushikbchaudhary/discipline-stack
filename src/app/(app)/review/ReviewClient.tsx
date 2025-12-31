"use client";

import { useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api";
import { getWeekStart } from "@/lib/time";

type ReviewClientProps = {
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
  q4?: string | null;
  stopDoing?: string | null;
  resistanceBlock?: string | null;
  locked: boolean;
};

export default function ReviewClient({
  q1,
  q2,
  q3,
  q4,
  stopDoing,
  resistanceBlock,
  locked,
}: ReviewClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await apiFetch("/review", {
          method: "POST",
          body: JSON.stringify({
            weekStartDate: formData.get("weekStartDate"),
            q1: formData.get("q1"),
            q2: formData.get("q2"),
            q3: formData.get("q3"),
            q4: formData.get("q4"),
            stopDoing: formData.get("stopDoing"),
            resistanceBlock: formData.get("resistanceBlock"),
          }),
        });
        toast.success("Weekly review saved.");
        window.location.reload();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save.";
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="card space-y-4 p-6">
      <input
        type="hidden"
        name="weekStartDate"
        value={getWeekStart(new Date()).toISOString().slice(0, 10)}
      />
      <div>
        <label className="text-sm font-medium">What moved me closer to the goal?</label>
        <textarea
          name="q1"
          defaultValue={q1 ?? ""}
          rows={3}
          disabled={locked}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What artifact did I create?</label>
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
