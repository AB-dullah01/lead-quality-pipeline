"use client";

import { CompanyLead, Confidence, SessionState } from "@/lib/types";

function fmtMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function ConfidencePill({ value }: { value: Confidence }) {
  const map: Record<Confidence, string> = {
    high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    medium: "bg-amber-500/20 text-amber-200 border-amber-500/40",
    low: "bg-rose-500/20 text-rose-200 border-rose-500/40",
    unknown: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  };
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${map[value]}`}
    >
      {value}
    </span>
  );
}

function cell(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "" || v === "NaN" || v === "N/A") {
    return <span className="text-slate-500">—</span>;
  }
  return <span>{String(v)}</span>;
}

type Props = {
  session: SessionState;
  onToggle: (id: string) => void;
  onToggleAllScored: () => void;
};

export function LeadsTable({ session, onToggle, onToggleAllScored }: Props) {
  const scored = session.leads.some((l) => l.fitScore != null);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1220]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Company results</h2>
          <p className="text-xs text-slate-400">
            {session.leads.length} leads · {session.industry} · {session.location}
          </p>
        </div>
        {scored && (
          <button
            type="button"
            onClick={onToggleAllScored}
            className="text-xs text-teal-300 hover:text-teal-200"
          >
            Select fit score ≥ 70
          </button>
        )}
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-2">Sel</th>
            <th className="px-3 py-2">Company</th>
            <th className="px-3 py-2">Fit</th>
            <th className="px-3 py-2">Est. revenue</th>
            <th className="px-3 py-2">Conf.</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Owner</th>
            <th className="px-3 py-2">Enrich</th>
            <th className="px-3 py-2">Credits</th>
          </tr>
        </thead>
        <tbody>
          {session.leads.map((lead: CompanyLead) => (
            <tr
              key={lead.id}
              className="border-t border-white/5 hover:bg-white/[0.03]"
            >
              <td className="px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={lead.selected}
                  onChange={() => onToggle(lead.id)}
                  className="accent-teal-400"
                />
              </td>
              <td className="px-3 py-2.5">
                <div className="font-medium text-slate-100">{lead.name}</div>
                <div className="text-xs text-slate-500">
                  {lead.city}, {lead.state}
                  {lead.website ? (
                    <>
                      {" · "}
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-400 hover:underline"
                      >
                        site
                      </a>
                    </>
                  ) : null}
                </div>
                {lead.scoreReason && (
                  <div className="mt-1 max-w-xs text-[11px] text-slate-500">
                    {lead.scoreReason}
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-slate-200">
                {lead.fitScore != null ? lead.fitScore : "—"}
              </td>
              <td className="px-3 py-2.5 text-slate-200">
                <div>{fmtMoney(lead.estimatedRevenue)}</div>
                {lead.revenueBand && (
                  <div className="text-[11px] text-slate-500">{lead.revenueBand}</div>
                )}
              </td>
              <td className="px-3 py-2.5">
                {lead.fitScore != null ? (
                  <ConfidencePill value={lead.revenueConfidence} />
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2.5 text-slate-300">{cell(lead.phone)}</td>
              <td className="px-3 py-2.5 text-slate-300">
                {cell(lead.ownerName)}
                {lead.ownerLinkedIn && (
                  <div>
                    <a
                      href={lead.ownerLinkedIn}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-400 hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge lead={lead} />
              </td>
              <td className="px-3 py-2.5 tabular-nums text-slate-300">
                {lead.creditsCharged}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ lead }: { lead: CompanyLead }) {
  if (lead.enrichStatus === "pending") {
    return <span className="text-xs text-slate-500">pending</span>;
  }
  if (lead.enrichStatus === "success") {
    return (
      <div className="space-y-1">
        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
          success
        </span>
        <div className="text-[10px] text-slate-500">
          {lead.fieldsFilled.length} fields · {lead.enrichConfidence}
        </div>
      </div>
    );
  }
  if (lead.enrichStatus === "empty") {
    return (
      <div className="space-y-1">
        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-200">
          empty · $0
        </span>
        <div className="text-[10px] text-slate-500">no charge</div>
      </div>
    );
  }
  return (
    <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs text-rose-200">
      failed
    </span>
  );
}
