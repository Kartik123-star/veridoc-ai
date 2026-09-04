import { useEffect, useState } from "react";

function bandFor(score) {
  if (score >= 75) return { color: "#34d399", glow: "rgba(52,211,153,0.45)", label: "Low Risk", text: "text-emerald-400", glowCls: "text-glow-emerald" };
  if (score >= 50) return { color: "#fbbf24", glow: "rgba(251,191,36,0.4)", label: "Review Required", text: "text-amber-400", glowCls: "text-glow-cyan" };
  return { color: "#f87171", glow: "rgba(248,113,113,0.5)", label: "CRITICAL TAMPER DETECTED", text: "text-red-400", glowCls: "text-glow-red" };
}

export default function TrustGauge({ score, size = 200, label, sub = "AUTHENTICITY SCORE" }) {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const band = bandFor(score);
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const t = setTimeout(() => setOffset(c * (1 - score / 100)), 150);
    return () => clearTimeout(t);
  }, [score, c]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#16233c"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={band.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 8px ${band.glow})`,
          }}
        />
      </svg>
      {/* Tick marks */}
      <div className="absolute inset-0 rounded-full border border-white/5" />
      <div className="absolute flex flex-col items-center text-center">
        <span className={`text-5xl font-extrabold tracking-tight ${band.text} ${band.glowCls}`}>{score}%</span>
        <span className={`mt-1.5 text-[11px] font-bold tracking-[0.14em] uppercase ${band.text}`}>{label || band.label}</span>
        <span className="mt-0.5 font-mono text-[10px] text-slate-500">{sub}</span>
      </div>
    </div>
  );
}