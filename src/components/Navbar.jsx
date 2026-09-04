import { useState } from "react";

const LINKS = [
  { id: "scan", label: "Scan Document" },
  { id: "dashboard", label: "Verification Dashboard" },
  { id: "analytics", label: "Tamper Analytics" },
  { id: "audit", label: "Audit Logs" },
];

function ShieldMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 ring-1 ring-cyan-400/40">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M12 3l7 2.5v5.2c0 4.4-2.9 8-7 10.3-4.1-2.3-7-5.9-7-10.3V5.5L12 3z"
          stroke="#22d3ee"
          strokeWidth="1.7"
        />
        <path
          d="M8.8 11.9l2.3 2.3 4.2-4.5"
          stroke="#34d399"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
    </div>
  );
}

export default function Navbar({ view, onNavigate }) {
  const [open, setOpen] = useState(false);

  const go = (id) => {
    onNavigate(id);
    setOpen(false);
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <button onClick={() => go("scan")} className="flex items-center gap-3 text-left">
          <ShieldMark />
          <span>
            <span className="block text-[15px] leading-tight font-bold tracking-tight text-slate-100">
              VeriDoc <span className="text-cyan-400">AI</span>
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-slate-500 uppercase">
              MHA Portal
              <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1 py-px text-[8px] font-semibold text-emerald-400">
                GOV·SEC
              </span>
            </span>
          </span>
        </button>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className={`relative rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
                view === l.id ? "text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {l.label}
              {view === l.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-3 md:flex">
          <span className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 font-mono text-[11px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            Systems Online
          </span>
          <span className="hidden rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] font-medium text-cyan-300 xl:block">
            SIH 2026 · SIH26188
          </span>
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg border border-line bg-panel p-2 text-slate-300 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-line bg-panel px-4 py-3 lg:hidden">
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                view === l.id ? "bg-cyan-500/10 text-cyan-300" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}