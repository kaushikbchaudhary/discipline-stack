"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";

import { saveOnboarding } from "@/app/(app)/onboarding/actions";

const initialState = { ok: false, error: "" };

export default function OnboardingForm() {
  const [state, formAction] = useActionState(saveOnboarding, initialState);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="card space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Wake time</label>
          <input
            name="wakeTime"
            type="time"
            defaultValue="06:00"
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Gym time (hours)</label>
          <input
            name="gymHours"
            type="number"
            min={1}
            max={6}
            defaultValue={2}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Cooking / chores (hours)</label>
          <input
            name="choresHours"
            type="number"
            min={1}
            max={6}
            defaultValue={2}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Income block (hours)</label>
          <input
            name="incomeHours"
            type="number"
            min={1}
            max={8}
            defaultValue={3}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Non-replaceable output (hours)</label>
          <input
            name="nonReplaceableHours"
            type="number"
            min={1}
            max={6}
            defaultValue={2}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Reflection block (hours)</label>
          <input
            name="reflectionHours"
            type="number"
            min={1}
            max={4}
            defaultValue={1}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
      >
        Generate timetable
      </button>
    </form>
  );
}
