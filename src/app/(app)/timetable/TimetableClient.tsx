"use client";

import { minutesToTimeString } from "@/lib/time";

const categories = [
  "CoreWork",
  "SupportWork",
  "Learning",
  "Practice",
  "Health",
  "Reflection",
  "Recovery",
];

type BlockView = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  category: string;
  mandatory: boolean;
};

type TimetableClientProps = {
  blocks: BlockView[];
  locked: boolean;
};

export default function TimetableClient({ blocks, locked }: TimetableClientProps) {
  const handleCreate = () => null;
  const handleUpdate = () => null;
  const handleDelete = () => null;
  const handleLockToggle = () => null;
  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Schedule lock</h2>
            <p className="text-sm text-muted">
              When locked, edits require a confirmation checkbox.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLockToggle}
            disabled
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              locked
                ? "bg-[color:var(--accent)] text-white"
                : "border border-[color:var(--border)] text-black"
            }`}
          >
            {locked ? "Locked" : "Unlocked"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-2xl font-semibold">Add block</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            name="name"
            placeholder="Block name"
            required
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <select
            name="category"
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
            required
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            name="startTime"
            type="time"
            required
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <input
            name="endTime"
            type="time"
            required
            className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
          />
          <label className="flex items-center gap-2 text-sm">
            <input name="mandatory" type="checkbox" /> Mandatory block
          </label>
          {locked ? (
            <label className="flex items-center gap-2 text-sm">
              <input name="confirmed" type="checkbox" value="true" /> Confirm schedule edit
            </label>
          ) : (
            <input type="hidden" name="confirmed" value="true" />
          )}
          <button
            type="submit"
            disabled
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add block
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <form key={block.id} onSubmit={handleUpdate} className="card p-6">
            <input type="hidden" name="id" value={block.id} />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{block.name}</h3>
                <p className="text-sm text-muted">
                  {minutesToTimeString(block.startTime)} - {minutesToTimeString(block.endTime)}
                </p>
              </div>
              <div className="chip text-muted">{block.category}</div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                name="name"
                defaultValue={block.name}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <select
                name="category"
                defaultValue={block.category}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                name="startTime"
                type="time"
                defaultValue={minutesToTimeString(block.startTime)}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <input
                name="endTime"
                type="time"
                defaultValue={minutesToTimeString(block.endTime)}
                className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input name="mandatory" type="checkbox" defaultChecked={block.mandatory} />
                Mandatory block
              </label>
              {locked ? (
                <label className="flex items-center gap-2 text-sm">
                  <input name="confirmed" type="checkbox" value="true" /> Confirm schedule edit
                </label>
              ) : (
                <input type="hidden" name="confirmed" value="true" />
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled
                className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                Save changes
              </button>
              <button
                type="button"
                disabled
                onClick={() => handleDelete(block.id)}
                className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-muted"
              >
                Delete block
              </button>
            </div>
          </form>
        ))}
        {blocks.length === 0 ? (
          <div className="card p-6">
            <p className="text-sm text-muted">No schedule blocks yet.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
