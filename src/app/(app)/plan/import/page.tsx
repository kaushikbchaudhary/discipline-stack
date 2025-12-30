"use client";

import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { buildPlanImportPrompt } from "@/lib/planImport";
import { importPlanJson, validatePlanJson } from "@/app/(app)/plan/import/actions";

export default function PlanImportPage() {
  const [days, setDays] = useState(30);
  const [goal, setGoal] = useState("Build consistent execution toward the primary goal.");
  const [goalType, setGoalType] = useState("CUSTOM");
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [jsonValue, setJsonValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [summary, setSummary] = useState<{ days: number; tasks: number; hours: number } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const promptText = useMemo(
    () => buildPlanImportPrompt({ days, goal, goalType, hoursPerDay }),
    [days, goal, goalType, hoursPerDay],
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText).then(() => {
      toast.success("Prompt copied.");
    });
  };

  const handleValidate = () => {
    startTransition(async () => {
      const result = await validatePlanJson({ json: jsonValue, hoursPerDay });
      if (result.ok) {
        toast.success("JSON is valid.");
        setIsValid(true);
      } else {
        toast.error(result.error || "Invalid JSON.");
        setIsValid(false);
      }
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      const result = await importPlanJson({ json: jsonValue, hoursPerDay });
      if (result.ok) {
        setSummary(result.summary ?? null);
        toast.success("Plan created.");
        setIsValid(false);
        setJsonValue("");
      } else {
        toast.error(result.error || "Import failed.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">AI Plan Import</p>
        <h1 className="text-3xl font-semibold">Generate and import a plan</h1>
        <p className="text-sm text-muted">
          Paste the prompt into ChatGPT, then import the JSON output here.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Prompt generator</h2>
          <p className="mt-2 text-sm text-muted">Paste this prompt into ChatGPT.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              type="number"
              min={7}
              max={90}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
              placeholder="Days"
            />
            <input
              type="number"
              min={1}
              max={12}
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(Number(event.target.value))}
              className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
              placeholder="Hours per day"
            />
            <input
              type="text"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm md:col-span-3"
              placeholder="Goal description"
            />
            <select
              value={goalType}
              onChange={(event) => setGoalType(event.target.value)}
              className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm md:col-span-3"
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
          <textarea
            readOnly
            value={promptText}
            rows={18}
            className="mt-4 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 w-full rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Copy prompt
          </button>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">JSON import</h2>
          <p className="mt-2 text-sm text-muted">
            Paste the ChatGPT JSON output. Each task must include date, start/end time, and duration.
          </p>
          <textarea
            value={jsonValue}
            onChange={(event) => setJsonValue(event.target.value)}
            rows={18}
            className="mt-4 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs"
            placeholder='{ "name": "..." }'
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleValidate}
              className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Validate JSON
            </button>
            <button
              type="button"
              disabled={isPending || !isValid}
              onClick={handleCreate}
              className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Create plan
            </button>
          </div>
          {summary ? (
            <div className="mt-4 rounded-2xl border border-[color:var(--border)] px-4 py-3 text-sm text-muted">
              Imported {summary.days} days · {summary.tasks} tasks · {summary.hours} hours
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
