export function RiskBadge({ risk }) {
  const map = {
    Authentic: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Suspicious: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Counterfeit: "bg-red-500/10 text-red-400 border-red-500/30",
    Rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    OK: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Passed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Failed: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  const dot = {
    Authentic: "bg-emerald-400",
    Suspicious: "bg-amber-400",
    Counterfeit: "bg-red-500",
    Rejected: "bg-red-500",
    OK: "bg-emerald-400",
    Passed: "bg-emerald-400",
    Failed: "bg-red-500",
  };
  const cls = map[risk] || map.Suspicious;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[risk] || "bg-amber-400"}`} />
      {risk}
    </span>
  );
}

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl border border-line bg-panel/80 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, desc, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-cyan-400/80 uppercase">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">{title}</h2>
        {desc && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{desc}</p>}
      </div>
      {right}
    </div>
  );
}