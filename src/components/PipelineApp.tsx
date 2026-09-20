"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SessionState } from "@/lib/types";
import { COUNTRIES, INDUSTRIES } from "@/lib/demo-data";
import { LeadsTable } from "@/components/LeadsTable";

type Toast = { type: "ok" | "err" | "info"; text: string };

export default function PipelineApp() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [storage, setStorage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [country, setCountry] = useState<string>(COUNTRIES[0].code);
  const [cityOrState, setCityOrState] = useState<string>("New York City, NY");
  const [product, setProduct] = useState<string>("");

  const show = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const start = useCallback(
    async (
      nextIndustry = industry,
      nextCountry = country,
      nextCity = cityOrState
    ) => {
      setLoading(true);
      try {
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: nextIndustry,
            country: nextCountry,
            cityOrState: nextCity,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start session");
        setSession(data.session);
        setStorage(data.storage);
        setLastSummary(null);
        show({
          type: "ok",
          text: `Loaded ${data.session.leads.length} ${nextIndustry} leads · ${data.session.location}`,
        });
      } catch (e) {
        show({
          type: "err",
          text: e instanceof Error ? e.message : "Failed to start",
        });
      } finally {
        setLoading(false);
      }
    },
    [industry, country, cityOrState, show]
  );

  useEffect(() => {
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIds = useMemo(
    () => session?.leads.filter((l) => l.selected).map((l) => l.id) ?? [],
    [session]
  );

  const toggle = (id: string) => {
    if (!session) return;
    setSession({
      ...session,
      leads: session.leads.map((l) =>
        l.id === id ? { ...l, selected: !l.selected } : l
      ),
    });
  };

  const toggleHighFit = () => {
    if (!session) return;
    setSession({
      ...session,
      leads: session.leads.map((l) => ({
        ...l,
        selected: (l.fitScore ?? 0) >= 70,
      })),
    });
  };

  const clearSearch = () => {
    setIndustry(INDUSTRIES[0]);
    setCountry(COUNTRIES[0].code);
    setCityOrState("");
    setProduct("");
  };

  const runScore = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Score failed");
      setSession(data.session);
      show({
        type: "ok",
        text: "Prioritized with revenue bands + confidence (no raw Gemini errors).",
      });
    } catch (e) {
      show({
        type: "err",
        text: e instanceof Error ? e.message : "Score failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const runEnrich = async () => {
    if (!session || selectedIds.length === 0) {
      show({ type: "info", text: "Select at least one company to enrich." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          leadIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enrich failed");
      setSession(data.session);
      const s = data.summary;
      setLastSummary(
        `${s.succeeded} enriched · ${s.emptyWaived} empty (not charged) · ${s.creditsChargedNow} credits used`
      );
      show({
        type: "ok",
        text: `Enrich done: ${s.succeeded} success, ${s.emptyWaived} empty waived, ${s.creditsChargedNow} credits charged.`,
      });
    } catch (e) {
      show({
        type: "err",
        text: e instanceof Error ? e.message : "Enrich failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,184,166,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(37,99,235,0.1),_transparent_50%)]" />

      <header className="relative z-10 border-b border-white/10 bg-[#070b14]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
              LeadTrust
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-xl text-white sm:text-2xl">
              Quality-first lead pipeline
            </h1>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Storage: {storage || "…"}</div>
            {session && (
              <div className="font-mono text-[10px] text-slate-500">
                {session.id.slice(0, 8)}…
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Credits remaining"
            value={session ? String(session.credits.remaining) : "—"}
            hint={
              session
                ? `${session.credits.charged} charged · ${session.credits.waivedEmpty} empty waived`
                : "Starting at 10"
            }
          />
          <Metric
            label="Selected"
            value={String(selectedIds.length)}
            hint="Max 25 per enrich batch"
          />
          <Metric
            label="Problem we fix"
            value="No empty $ burns"
            hint="Unlike charging credits for website-only enrich"
          />
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0b1220]/90 p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-white">
            Search criteria
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Matched to SaaSquatch: industry, optional product, 4 countries +
            city/state.
          </p>

          <div className="mt-4 grid gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-500">Industry</span>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#070b14] px-3 py-2 text-slate-100"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-slate-500">
                Product (optional)
              </span>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Enter product (optional)"
                className="w-full rounded-lg border border-white/15 bg-[#070b14] px-3 py-2 text-slate-100 placeholder:text-slate-600"
              />
            </label>

            <div>
              <span className="mb-1 block text-xs text-slate-500">Location</span>
              <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-lg border border-white/15 bg-[#070b14] px-3 py-2 text-slate-100"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  value={cityOrState}
                  onChange={(e) => setCityOrState(e.target.value)}
                  placeholder="Enter city or state"
                  className="rounded-lg border border-white/15 bg-[#070b14] px-3 py-2 text-slate-100 placeholder:text-slate-600"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Try: NY, Texas, Toronto, London, Paris — or any free-text city.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void start(industry, country, cityOrState)}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
              >
                Find companies
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0b1220]/90 p-4 sm:p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-white">
            Operator workflow
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Score with confidence → enrich only high-fit leads → never charge
            when enrichment returns zero usable fields. No NaN. No raw model
            errors in the table.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading || !session}
              onClick={() => void runScore()}
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
            >
              1. Estimate & score
            </button>
            <button
              type="button"
              disabled={loading || !session || selectedIds.length === 0}
              onClick={() => void runEnrich()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              2. Enrich selected (−1 only if filled)
            </button>
            {session && (
              <a
                href={`/api/export?id=${session.id}`}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Export CSV
              </a>
            )}
          </div>
          {lastSummary && (
            <p className="mt-3 text-sm text-teal-300/90">{lastSummary}</p>
          )}
        </section>

        {session ? (
          <LeadsTable
            session={session}
            onToggle={toggle}
            onToggleAllScored={toggleHighFit}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-slate-400">
            Loading session…
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#0b1220]/80 p-4 text-sm text-slate-400">
            <h3 className="mb-2 font-semibold text-slate-200">How to demo</h3>
            <ol className="list-decimal space-y-1 pl-4">
              <li>
                Pick country (USA / Canada / UK / France) + city or state, then
                Find companies.
              </li>
              <li>Estimate & score — buy-box match + revenue bands.</li>
              <li>Select fit ≥ 70, or deliberately pick thin leads.</li>
              <li>
                Enrich — rich leads fill owner/employees; thin leads return{" "}
                <em>empty · $0</em>.
              </li>
            </ol>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1220]/80 p-4 text-sm text-slate-400">
            <h3 className="mb-2 font-semibold text-slate-200">Stack</h3>
            <p>
              Next.js 15 (React) · serverless API routes · Firestore when
              configured else in-memory · score cache TTL · Vercel-ready.
            </p>
          </div>
        </section>
      </main>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "ok"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-100"
              : toast.type === "err"
                ? "border-rose-500/40 bg-rose-950 text-rose-100"
                : "border-slate-500/40 bg-slate-900 text-slate-100"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1220]/90 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-2xl text-white">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
