import { useMemo, useState } from "react";
import { METRICS, sampleDocuments } from "../data/sampleData";
import { downloadForensicReport } from "../lib/forensics";
import { Card, RiskBadge, SectionHeader } from "./ui";

function MetricCard({ icon, label, value, sub, tone }) {
  const tones = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    red: "text-red-400 bg-red-500/10",
    cyan: "text-cyan-300 bg-cyan-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{icon}</span>
        <p className="font-mono text-[10px] font-medium tracking-widest text-slate-500 uppercase">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </Card>
  );
}

const ICONS = {
  scan: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20.5 20.5L16 16" strokeLinecap="round" />
      <path d="M8 11h6" strokeLinecap="round" />
    </svg>
  ),
  flag: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 21V4m0 2h14l-3 4 3 4H4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  ),
  score: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" strokeLinecap="round" />
    </svg>
  ),
};

export default function Dashboard({ live = [] }) {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("All");
  const [toast, setToast] = useState(null);

  // Live session scans (newest first) sit above the seeded register; both are
  // re-sorted by timestamp so rows stay chronological regardless of when a scan ran.
  const rows = useMemo(() => [...live, ...sampleDocuments], [live]);
  const filtered = useMemo(
    () =>
      rows
        .filter(
          (d) =>
            (risk === "All" || d.risk === risk) &&
            `${d.id} ${d.type} ${d.officer} ${d.timestamp}`.toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [q, risk, rows]
  );

  const exportDoc = (d) => {
    downloadForensicReport({
      id: d.id,
      docType: d.type,
      name: "ARCHIVED — RESTRICTED",
      docNumber: "••••",
      issueDate: "—",
      validTill: "—",
      faceMatch: d.risk !== "Counterfeit",
      score: d.score,
      verdict: d.risk,
      processingMs: 1124,
      zones: [],
    });
    setToast(`Forensic report exported → Forensic-Report-${d.id}.pdf`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <section className="animate-fade-up">
      <SectionHeader
        eyebrow="Verification Dashboard"
        title="Real-time Screening Overview"
        desc="Live pipeline metrics and the searchable register of every document screened by VeriDoc AI across MHA checkpoints."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
              LIVE · 24×7 CHECKPOINT FEED
            </span>
            {live.length > 0 && (
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] font-medium text-cyan-300">
                +{live.length} THIS SESSION
              </span>
            )}
          </div>
        }
      />

      {/* Metric cards */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ICONS.scan} label="Total Scanned" value={METRICS.totalScanned.toLocaleString()} sub="+312 in the last 24h" tone="cyan" />
        <MetricCard icon={ICONS.flag} label="Counterfeits Flagged" value={METRICS.counterfeits.toLocaleString()} sub="9.4% of all scans this month" tone="red" />
        <MetricCard icon={ICONS.clock} label="Avg Processing Time" value="1.12s" sub="Within <1.2s SLA · p95 1.41s" tone="emerald" />
        <MetricCard icon={ICONS.score} label="Avg Authenticity" value={`${METRICS.avgScore}%`} sub="Across all verified documents" tone="amber" />
      </div>

      {/* Table */}
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
              placeholder="Search by Document ID, type, officer…"
              className="w-64 rounded-xl border border-line bg-panel-2 py-2 pr-3 pl-9 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-cyan-500/60 sm:w-80"
            />
          </div>
          <div className="flex items-center gap-2">
            {["All", "Authentic", "Suspicious", "Counterfeit", "Rejected"].map((r) => (
              <button
                key={r}
                onClick={() => setRisk(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  risk === r ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40" : "text-slate-400 hover:bg-white/5"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2/60 font-mono text-[10px] tracking-widest text-slate-500 uppercase">
                <th className="px-4 py-3 font-medium">Document ID</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Officer</th>
                <th className="px-4 py-3 font-medium">Risk Level</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 text-right font-medium">Report</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={`${d.timestamp}-${i}`}
                  className={`border-b border-line/50 transition-colors last:border-0 hover:bg-cyan-500/[0.04] ${d.live ? "bg-cyan-500/[0.04]" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-cyan-300">{d.id}</td>
                  <td className="px-4 py-3 text-slate-300">{d.type}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.timestamp}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400">{d.officer}</span>
                      {d.live && (
                        <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-cyan-300">
                          SESSION
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={d.risk} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-panel-2">
                        <div
                          className={`h-full rounded-full ${
                            d.score >= 75 ? "bg-emerald-400" : d.score >= 50 ? "bg-amber-400" : "bg-red-500"
                          }`}
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-400">{d.score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => exportDoc(d)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 3v11m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
                      </svg>
                      Forensic PDF
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No documents match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-xl border border-emerald-500/40 bg-panel px-4 py-3 text-sm font-medium text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
          {toast}
        </div>
      )}
    </section>
  );
}