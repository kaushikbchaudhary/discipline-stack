import { useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";

import { apiFetch } from "@/lib/api";

export default function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    goalTitle: "Build consistent execution",
    goalDescription: "",
    goalType: "CUSTOM",
    startDate: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await apiFetch("/onboarding", {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Goal saved.");
        window.location.href = "/today";
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save.";
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Primary goal title</label>
          <input
            name="goalTitle"
            type="text"
            required
            value={form.goalTitle}
            onChange={(event) => setForm((prev) => ({ ...prev, goalTitle: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Goal description (optional)</label>
          <textarea
            name="goalDescription"
            rows={2}
            value={form.goalDescription}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, goalDescription: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Goal type</label>
          <select
            name="goalType"
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
            value={form.goalType}
            onChange={(event) => setForm((prev) => ({ ...prev, goalType: event.target.value }))}
          >
            <option value="EXAM_PREP">Exam prep</option>
            <option value="CAREER_GROWTH">Career growth</option>
            <option value="BUSINESS">Business</option>
            <option value="SKILL_BUILDING">Skill building</option>
            <option value="HEALTH">Health</option>
            <option value="PERSONAL_SYSTEM">Personal system</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Start date</label>
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        Save goal
      </button>
    </form>
  );
}
