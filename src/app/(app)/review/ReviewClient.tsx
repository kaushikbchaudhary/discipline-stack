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
};

export default function ReviewClient({ q1, q2, q3, q4 }: ReviewClientProps) {
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
    <form onSubmit={handleSave} className="card space-y-4 p-6">
      <div>
        <label className="text-sm font-medium">What moved me closer to income?</label>
        <textarea
          name="q1"
          defaultValue={q1 ?? ""}
          rows={3}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What output did I create?</label>
        <textarea
          name="q2"
          defaultValue={q2 ?? ""}
          rows={3}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Where did I overthink?</label>
        <textarea
          name="q3"
          defaultValue={q3 ?? ""}
          rows={3}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium">What do I remove next week?</label>
        <textarea
          name="q4"
          defaultValue={q4 ?? ""}
          rows={3}
          className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        Save review
      </button>
    </form>
  );
}
