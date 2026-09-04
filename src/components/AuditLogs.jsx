import { useMemo, useState } from "react";
import { auditLogs } from "../data/sampleData";
import { Card, RiskBadge, SectionHeader } from "./ui";

export default function AuditLogs({ live = [] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState(null);

  // Live session entries sit above the seeded ledger, kept chronological.
  const rows = useMemo(() => [...live, ...auditLogs], [live]);
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (l) =>
            (filter === "All" || l.result === filter) &&
            `${l.actor} ${l.action} ${l.docId} ${l.session}`.toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => b.time.localeCompare(a.time)),
    [q, filter, rows]
  );

  const exportCsv = () => {
    const head = "Timestamp,Actor,Action,Document ID,Result,Session,IP";
    const rows = filtered.map((l) =>
      [l.time, `"${l.actor}"`, `"${l.action}"`, l.docId, l.result, `"${l.session}"`, l.ip].join(",")
    );
    const blob = new Blob([head + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veridoc-audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Exported ${filtered.length} audit entries → veridoc-audit-logs.csv`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <section className="animate-fade-up">
      <SectionHeader
        eyebrow="Audit Logs"
        title="Immutable Activity Trail"
        desc="Every scan, export and system event is hashed into an append-only ledger. Logs are retained 7 years per MHA data policy."
        right={
          <div className="flex flex-wrap items-center gap-2">
            {live.length > 0 && (
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] font-medium text-cyan-300">
                +{live.length} THIS SESSION
              </span>
            )}
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl border border-line bg-panel px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v11m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export CSV
            </button>
          </div>
        }
      />

      <Card className="mt-7 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20.5 20.5L16 16" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search actor, action, session…"
              className="w-64 rounded-xl border border-line bg-panel-2 py-2 pr-3 pl-9 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/60 sm:w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            {["All", "Authentic", "Suspicious", "Counterfeit", "Rejected", "OK"].map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === r ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40" : "text-slate-400 hover:bg-white/5"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2/60 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Document ID</th>
                <th className="px-4 py-3 font-medium">Result</th>
                <th className="px-4 py-3 font-medium">Session / IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr
                  key={`${l.time}-${i}`}
                  className={`border-b border-line/50 transition-colors last:border-0 hover:bg-cyan-500/[0.04] ${l.live ? "bg-cyan-500/[0.04]" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-400">{l.time}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className={`text-slate-300 ${l.actor === "System" ? "text-cyan-300" : ""}`}>{l.actor}</span>
                      {l.live && (
                        <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-cyan-300">
                          SESSION
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-slate-300">{l.action}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{l.docId}</td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={l.result} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-slate-500">
                    {l.session} · {l.ip}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No log entries match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-xl border border-emerald-500/40 bg-panel px-4 py-3 text-sm font-medium text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
          {toast}
        </div>
      )}
    </section>
  );
}