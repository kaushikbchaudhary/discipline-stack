export default function OnboardingForm() {
  return (
    <div className="card space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Primary goal title</label>
          <input
            name="goalTitle"
            type="text"
            required
            defaultValue="Build consistent execution"
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Goal description (optional)</label>
          <textarea
            name="goalDescription"
            rows={2}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Goal type</label>
          <select
            name="goalType"
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
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
          <label className="text-sm font-medium">Wake time</label>
          <input
            name="wakeTime"
            type="time"
            defaultValue="06:00"
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Daily execution capacity (hours)</label>
          <input
            name="dailyCapacityHours"
            type="number"
            min={3}
            max={10}
            defaultValue={4}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Health non-negotiable (hours)</label>
          <input
            name="healthHours"
            type="number"
            min={1}
            max={4}
            defaultValue={2}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Recovery buffer (hours)</label>
          <input
            name="recoveryHours"
            type="number"
            min={1}
            max={6}
            defaultValue={2}
            className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
        </div>
      </div>
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-alt)] px-4 py-3 text-sm text-muted">
        Onboarding will be reconnected to the Worker API in the next step.
      </div>
    </div>
  );
}
