"use client";

import Link from "next/link";
import { useState } from "react";

type WizardState = {
  brokerage: { name: string; city: string; languages: string[]; teamSize: number };
  sources: string[];
  whatsapp: {
    skipped: boolean;
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
    verifyToken: string;
    appSecret: string;
  };
  voice: {
    skipped: boolean;
    provider: string;
    accountSid: string;
    authToken: string;
    fromNumber: string;
    callingHoursStart: string;
    callingHoursEnd: string;
    languages: string[];
  };
  ai: {
    skipped: boolean;
    provider: string;
    model: string;
    apiKey: string;
    spendCapUsd: number;
  };
  approvals: { whatsapp: boolean; voice: boolean; dndCheck: boolean; approver: string };
};

const initialState: WizardState = {
  brokerage: { name: "", city: "", languages: ["English"], teamSize: 5 },
  sources: ["Meta Lead Ads", "Website"],
  whatsapp: { skipped: false, phoneNumberId: "", wabaId: "", accessToken: "", verifyToken: "", appSecret: "" },
  voice: {
    skipped: false,
    provider: "twilio",
    accountSid: "",
    authToken: "",
    fromNumber: "",
    callingHoursStart: "10:00",
    callingHoursEnd: "19:00",
    languages: ["English", "Hindi"],
  },
  ai: { skipped: false, provider: "openrouter", model: "openrouter/auto", apiKey: "", spendCapUsd: 10 },
  approvals: { whatsapp: true, voice: true, dndCheck: true, approver: "Owner" },
};

const SOURCE_OPTIONS = [
  "Meta Lead Ads",
  "Google Forms",
  "99acres",
  "MagicBricks",
  "Website",
  "Walk-in",
  "Referral",
  "Google Sheets / CSV",
  "WhatsApp",
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Hinglish", "Marathi", "Punjabi", "Tamil"];

const STEPS = [
  { id: 1, title: "Brokerage", subtitle: "Tell us about your team." },
  { id: 2, title: "Lead sources", subtitle: "Where do your leads come from?" },
  { id: 3, title: "WhatsApp", subtitle: "Optional. Connect WhatsApp Business Cloud.", skippable: true },
  { id: 4, title: "Voice", subtitle: "Optional. Connect AI voice calling.", skippable: true },
  { id: 5, title: "AI provider", subtitle: "Optional. Bring your own key or use platform-managed.", skippable: true },
  { id: 6, title: "Approvals", subtitle: "Who approves external sends and calls?" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-[#111827]"
    />
  );
}

function ChipMulti({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            type="button"
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-[#111827] bg-[#111827] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  label,
  hint,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-400"
    >
      <span
        className={`mt-0.5 grid h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
          value ? "bg-[#111827]" : "bg-slate-200"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${value ? "translate-x-4" : ""}`}
        />
      </span>
      <span className="text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        {hint ? <span className="ml-2 text-xs text-slate-500">{hint}</span> : null}
      </span>
    </button>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    tenantId: string;
    provisioning: Record<string, string>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS.find((s) => s.id === step)!;
  const canSkip = Boolean(currentStep.skippable);

  function update<K extends keyof WizardState>(key: K, patch: Partial<WizardState[K]>) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function toggleSource(value: string) {
    setState((prev) => ({
      ...prev,
      sources: prev.sources.includes(value)
        ? prev.sources.filter((s) => s !== value)
        : [...prev.sources, value],
    }));
  }

  function toggleLanguage(scope: "brokerage" | "voice", value: string) {
    setState((prev) => {
      const list = prev[scope].languages;
      const next = list.includes(value) ? list.filter((l) => l !== value) : [...list, value];
      return { ...prev, [scope]: { ...prev[scope], languages: next } };
    });
  }

  function skip() {
    if (step === 3) update("whatsapp", { skipped: true });
    if (step === 4) update("voice", { skipped: true });
    if (step === 5) update("ai", { skipped: true });
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function next() {
    if (step === 1 && !state.brokerage.name.trim()) {
      setError("Brokerage name is required");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error ?? "Submission failed");
      } else {
        setResult({ tenantId: data.tenantId, provisioning: data.provisioning });
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="flex min-h-screen flex-col bg-[#f7f4ee] text-[#111827]">
        <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">P</div>
            Pratap AI
          </Link>
        </nav>
        <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-6 pb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">
            Workspace ready
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">You&apos;re set.</h1>
          <p className="max-w-md text-sm text-slate-600">
            Tenant {result.tenantId} is configured. WhatsApp, voice, and AI activate as soon as you connect each one — you can connect them later from settings.
          </p>
          <div className="grid w-full gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm">
            {Object.entries(result.provisioning).map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-3">
                <span className="font-medium capitalize text-slate-700">{key}</span>
                <span className="text-xs text-slate-500">{value}</span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white"
          >
            Open workspace
            <span aria-hidden>→</span>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f4ee] text-[#111827]">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-xs font-semibold text-white">P</div>
          Pratap AI
        </Link>
        <span className="text-xs font-medium text-slate-500">
          Step {step} of {STEPS.length}
        </span>
      </nav>

      <section className="mx-auto w-full max-w-2xl px-6 pb-16">
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition ${
                s.id <= step ? "bg-[#111827]" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b88a2d]">
            {currentStep.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {currentStep.subtitle}
          </h1>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {step === 1 && (
            <div className="grid gap-4">
              <Field label="Brokerage name">
                <Input
                  value={state.brokerage.name}
                  onChange={(next) => update("brokerage", { name: next })}
                  placeholder="e.g. Pratap Realty"
                />
              </Field>
              <Field label="Primary city">
                <Input
                  value={state.brokerage.city}
                  onChange={(next) => update("brokerage", { city: next })}
                  placeholder="e.g. Noida"
                />
              </Field>
              <Field label="Team size">
                <Input
                  type="number"
                  value={String(state.brokerage.teamSize)}
                  onChange={(next) =>
                    update("brokerage", { teamSize: Math.max(1, Number(next) || 1) })
                  }
                />
              </Field>
              <Field label="Languages your team speaks">
                <ChipMulti
                  options={LANGUAGE_OPTIONS}
                  selected={state.brokerage.languages}
                  onToggle={(value) => toggleLanguage("brokerage", value)}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <Field
                label="Where leads come from today"
                hint="Pick all that apply — you can add more later."
              >
                <ChipMulti
                  options={SOURCE_OPTIONS}
                  selected={state.sources}
                  onToggle={toggleSource}
                />
              </Field>
              <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
                After you finish, paste these webhook URLs into Meta, your portal parser, or n8n:
                <code className="mt-2 block rounded-md bg-white px-2 py-1.5 text-[11px] text-slate-700">
                  POST /api/ingest/leads
                </code>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <p className="text-xs text-slate-500">
                Find these in Meta for Developers → WhatsApp Business → Phone Numbers and App settings.
                Tokens are encrypted at rest and never sent to the browser.
              </p>
              <Field label="Phone Number ID">
                <Input
                  value={state.whatsapp.phoneNumberId}
                  onChange={(value) => update("whatsapp", { phoneNumberId: value })}
                  placeholder="123456789012345"
                />
              </Field>
              <Field label="WABA ID">
                <Input
                  value={state.whatsapp.wabaId}
                  onChange={(value) => update("whatsapp", { wabaId: value })}
                  placeholder="987654321098765"
                />
              </Field>
              <Field label="Access Token">
                <Input
                  type="password"
                  value={state.whatsapp.accessToken}
                  onChange={(value) => update("whatsapp", { accessToken: value })}
                  placeholder="EAA…"
                />
              </Field>
              <Field label="Verify Token (you set this)">
                <Input
                  value={state.whatsapp.verifyToken}
                  onChange={(value) => update("whatsapp", { verifyToken: value })}
                  placeholder="any-long-random-string"
                />
              </Field>
              <Field label="App Secret">
                <Input
                  type="password"
                  value={state.whatsapp.appSecret}
                  onChange={(value) => update("whatsapp", { appSecret: value })}
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4">
              <p className="text-xs text-slate-500">
                The voice agent handles qualification, retries, and transcripts. Skip if you&apos;re not
                ready to connect a telephony provider yet.
              </p>
              <Field label="Provider">
                <select
                  value={state.voice.provider}
                  onChange={(event) => update("voice", { provider: event.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#111827]"
                >
                  <option value="twilio">Twilio</option>
                  <option value="plivo">Plivo</option>
                  <option value="telnyx">Telnyx</option>
                  <option value="vonage">Vonage</option>
                </select>
              </Field>
              <Field label="Account SID">
                <Input
                  value={state.voice.accountSid}
                  onChange={(value) => update("voice", { accountSid: value })}
                />
              </Field>
              <Field label="Auth Token">
                <Input
                  type="password"
                  value={state.voice.authToken}
                  onChange={(value) => update("voice", { authToken: value })}
                />
              </Field>
              <Field label="From number">
                <Input
                  value={state.voice.fromNumber}
                  onChange={(value) => update("voice", { fromNumber: value })}
                  placeholder="+91…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Calling hours start">
                  <Input
                    type="time"
                    value={state.voice.callingHoursStart}
                    onChange={(value) => update("voice", { callingHoursStart: value })}
                  />
                </Field>
                <Field label="Calling hours end">
                  <Input
                    type="time"
                    value={state.voice.callingHoursEnd}
                    onChange={(value) => update("voice", { callingHoursEnd: value })}
                  />
                </Field>
              </div>
              <Field label="Languages to qualify in">
                <ChipMulti
                  options={LANGUAGE_OPTIONS}
                  selected={state.voice.languages}
                  onToggle={(value) => toggleLanguage("voice", value)}
                />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4">
              <p className="text-xs text-slate-500">
                The agent works in deterministic mode without a key. Add one to enable richer
                reasoning, drafts, and explanations.
              </p>
              <Field label="Provider">
                <select
                  value={state.ai.provider}
                  onChange={(event) => update("ai", { provider: event.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#111827]"
                >
                  <option value="openrouter">OpenRouter (recommended)</option>
                  <option value="vercel-gateway">Vercel AI Gateway</option>
                  <option value="anthropic">Anthropic direct</option>
                  <option value="openai">OpenAI direct</option>
                </select>
              </Field>
              <Field label="Model">
                <Input
                  value={state.ai.model}
                  onChange={(value) => update("ai", { model: value })}
                />
              </Field>
              <Field label="API key">
                <Input
                  type="password"
                  value={state.ai.apiKey}
                  onChange={(value) => update("ai", { apiKey: value })}
                  placeholder="stored server-side, encrypted"
                />
              </Field>
              <Field label="Daily spend cap (USD)" hint="Hard stop. The agent pauses at this limit.">
                <Input
                  type="number"
                  value={String(state.ai.spendCapUsd)}
                  onChange={(value) => update("ai", { spendCapUsd: Math.max(0, Number(value) || 0) })}
                />
              </Field>
            </div>
          )}

          {step === 6 && (
            <div className="grid gap-3">
              <Toggle
                value={state.approvals.whatsapp}
                onChange={(next) => update("approvals", { whatsapp: next })}
                label="Require approval before sending WhatsApp"
                hint="Recommended"
              />
              <Toggle
                value={state.approvals.voice}
                onChange={(next) => update("approvals", { voice: next })}
                label="Require approval before placing AI calls"
                hint="Recommended"
              />
              <Toggle
                value={state.approvals.dndCheck}
                onChange={(next) => update("approvals", { dndCheck: next })}
                label="Block DND / unconsented leads from outbound"
              />
              <Field label="Default approver">
                <Input
                  value={state.approvals.approver}
                  onChange={(value) => update("approvals", { approver: value })}
                  placeholder="e.g. Owner / Sales head"
                />
              </Field>
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="text-sm font-medium text-slate-500 transition hover:text-[#111827] disabled:opacity-30"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            {canSkip ? (
              <button
                type="button"
                onClick={skip}
                className="text-sm font-medium text-slate-500 transition hover:text-[#111827]"
              >
                Skip for now
              </button>
            ) : null}
            {step < STEPS.length ? (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
              >
                {submitting ? "Finishing…" : "Finish setup"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
