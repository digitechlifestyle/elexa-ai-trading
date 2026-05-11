"use client";

import { useState } from "react";

export interface RiskLimits {
  max_position_size_usd: number;
  max_daily_loss_usd: number;
  max_open_positions: number;
  stop_loss_pct: number;
}

export default function SettingsForm({ initial }: { initial: RiskLimits }) {
  const [limits, setLimits] = useState<RiskLimits>(initial);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null
  );

  function set<K extends keyof RiskLimits>(k: K, v: string) {
    const n = Number(v);
    setLimits((prev) => ({ ...prev, [k]: Number.isFinite(n) ? n : prev[k] }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limits),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, msg: data.error ?? "Failed to save" });
      } else {
        setStatus({ ok: true, msg: "Risk limits updated." });
      }
    } catch {
      setStatus({ ok: false, msg: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="bg-[var(--card)] border border-[var(--card-border)] rounded-xl p-6 space-y-5"
    >
      <div className="bg-amber-950 border border-amber-800 rounded-lg p-3 text-amber-200 text-xs">
        ⚠️ Risk limits are enforced server-side on every order. Changing them
        affects every future trade. Don&apos;t raise limits in the middle of a
        losing streak.
      </div>

      <Field
        label="Max position size (USD per trade)"
        value={limits.max_position_size_usd}
        min={1}
        max={1_000_000}
        step={100}
        onChange={(v) => set("max_position_size_usd", v)}
        hint="Highest order value allowed in a single trade. Default $5,000."
      />
      <Field
        label="Max daily loss (USD)"
        value={limits.max_daily_loss_usd}
        min={1}
        max={100_000}
        step={50}
        onChange={(v) => set("max_daily_loss_usd", v)}
        hint="Trading pauses when this is reached. Default $500."
      />
      <Field
        label="Max open positions"
        value={limits.max_open_positions}
        min={1}
        max={1000}
        step={1}
        onChange={(v) => set("max_open_positions", v)}
        hint="Maximum simultaneous positions. Default 10."
      />
      <Field
        label="Stop-loss (%)"
        value={limits.stop_loss_pct}
        min={0.1}
        max={50}
        step={0.1}
        onChange={(v) => set("stop_loss_pct", v)}
        hint="Automatic exit threshold. Default 5%."
      />

      {status && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            status.ok
              ? "bg-green-950 border border-green-800 text-green-300"
              : "bg-red-950 border border-red-800 text-red-300"
          }`}
        >
          {status.msg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
      >
        {saving ? "Saving…" : "Save Risk Limits"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-600"
      />
      {hint && <p className="text-xs text-[var(--muted)] mt-1.5">{hint}</p>}
    </div>
  );
}
