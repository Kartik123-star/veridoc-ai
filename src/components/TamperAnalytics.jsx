import { tamperByType, trend, riskDistribution, topTechniques } from "../data/sampleData";
import { Card, SectionHeader } from "./ui";

function RiskDonut() {
  const r = 60;
  const c = 2 * Math.PI * r;
  const segs = [
    { label: "Authentic", value: riskDistribution.authentic, color: "#34d399" },
    { label: "Suspicious", value: riskDistribution.suspicious, color: "#fbbf24" },
    { label: "Counterfeit", value: riskDistribution.counterfeit, color: "#f87171" },
  ];
  let acc = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: 170, height: 170 }}>
        <svg width={170} height={170} className="-rotate-90">
          {segs.map((s) => {
            const frac = s.value / 100;
            const dash = frac * c;
            const el = (
              <circle
                key={s.label}
                cx={85}
                cy={85}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={18}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-acc * c}
                strokeLinecap="butt"
              />
            );
            acc += frac;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-100">{riskDistribution.authentic}%</span>
          <span className="font-mono text-[9px] tracking-widest text-slate-500 uppercase">Authentic</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="w-24 text-slate-300">{s.label}</span>
            <span className="font-mono font-semibold text-slate-100">{s.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeBars() {
  const max = Math.max(...tamperByType.map((t) => t.rate));
  return (
    <div className="space-y-4">
      {tamperByType.map((t) => (
        <div key={t.type}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">{t.type}</span>
            <span className="font-mono text-slate-400">{t.rate}% flag rate</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500"
              style={{ width: `${(t.rate / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
        Passports show the highest forgery pressure at border counters — driven by MRZ re-printing and photo substitution.
      </p>
    </div>
  );
}

function TrendChart() {
  const W = 560;
  const H = 170;
  const pad = 22;
  const max = Math.max(...trend.map((t) => t.count));
  const min = Math.min(...trend.map((t) => t.count));
  const span = max - min || 1;
  const x = (i) => pad + (i * (W - pad * 2)) / (trend.length - 1);
  const y = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
  const pts = trend.map((t, i) => `${x(i)},${y(t.count)}`).join(" ");
  const area = `${pad},${H - pad} ${pts} ${x(trend.length - 1)},${H - pad}`;
  const id = "trendGrad";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - pad * 2)} y2={pad + f * (H - pad * 2)} stroke="#1c2a44" strokeDasharray="4 6" />
        ))}
        <polygon points={area} fill={`url(#${id})`} />
        <polyline points={pts} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {trend.map((t, i) => (
          <g key={t.month}>
            <circle cx={x(i)} cy={y(t.count)} r="3.5" fill="#0a111e" stroke="#22d3ee" strokeWidth="2" />
            <text x={x(i)} y={H - 6} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {t.month}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
        <span>Apr 2026</span>
        <span>Counterfeit documents intercepted / month</span>
        <span>Sep 2026</span>
      </div>
    </div>
  );
}

const SEV_CHIP = {
  High: "bg-red-500/15 text-red-400",
  Medium: "bg-amber-500/15 text-amber-400",
  Low: "bg-slate-500/15 text-slate-400",
};

export default function TamperAnalytics() {
  const maxCount = Math.max(...topTechniques.map((t) => t.count));
  return (
    <section className="animate-fade-up">
      <SectionHeader
        eyebrow="Tamper Analytics"
        title="Forensic Signal Intelligence"
        desc="Aggregate anomaly signatures across every checkpoint — which regions of a document forgers target, and how techniques evolve."
        right={
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] font-medium text-cyan-300">
            MODEL v2.4.1 · AUC 99.2%
          </span>
        }
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <p className="mb-5 font-mono text-[11px] tracking-widest text-slate-500 uppercase">Verdict Distribution</p>
          <RiskDonut />
        </Card>

        <Card className="p-6">
          <p className="mb-5 font-mono text-[11px] tracking-widest text-slate-500 uppercase">Tamper Rate by Document Type</p>
          <TypeBars />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <p className="mb-5 font-mono text-[11px] tracking-widest text-slate-500 uppercase">Counterfeits Intercepted — 6-Month Trend</p>
          <TrendChart />
        </Card>
      </div>

      {/* Top techniques */}
      <Card className="mt-5 p-6">
        <p className="mb-5 font-mono text-[11px] tracking-widest text-slate-500 uppercase">Most Common Tamper Techniques</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {topTechniques.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 rounded-xl border border-line bg-panel-2/50 px-4 py-3"
            >
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase ${SEV_CHIP[t.severity]}`}>
                {t.severity}
              </span>
              <span className="flex-1 text-[12px] font-medium text-slate-200">{t.name}</span>
              <div className="flex items-center gap-2">
                <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-panel sm:block">
                  <div
                    className={`h-full rounded-full ${t.severity === "High" ? "bg-red-500" : t.severity === "Medium" ? "bg-amber-400" : "bg-slate-400"}`}
                    style={{ width: `${(t.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-slate-400">{t.count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}