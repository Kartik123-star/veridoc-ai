import { useState } from "react";
import { liveAuditRow, liveRegisterRow } from "./data/sampleData";
import Navbar from "./components/Navbar";
import Scanner from "./components/Scanner";
import ResultsView from "./components/ResultsView";
import Dashboard from "./components/Dashboard";
import TamperAnalytics from "./components/TamperAnalytics";
import AuditLogs from "./components/AuditLogs";

function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-line">
      <div className="bg-grid absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="mx-auto mb-5 flex flex-wrap items-center justify-center gap-2 font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">
          <span className="rounded-full border border-line bg-panel px-3 py-1">Ministry of Home Affairs</span>
          <span className="rounded-full border border-line bg-panel px-3 py-1">Bureau of Immigration</span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-300">SIH 2026 · SIH26188</span>
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl leading-tight font-extrabold tracking-tight text-slate-100 sm:text-5xl">
          AI-Powered Forensic Verification for{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Border Security</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Real-time fake identity &amp; document screening — OCR, font forensics, Error Level Analysis and face biometrics
          fused into a single authenticity score, trusted at 128 MHA checkpoints.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {[
            ["12,847", "Documents screened"],
            ["1.12s", "Average decision"],
            ["99.2%", "Model AUC"],
            ["24×7", "Checkpoint uptime"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-line bg-panel/70 px-5 py-3 backdrop-blur-sm">
              <p className="text-lg font-extrabold text-slate-100">{v}</p>
              <p className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-panel/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-slate-100">
              VeriDoc <span className="text-cyan-400">AI</span> <span className="font-mono text-[10px] text-slate-500">| MHA PORTAL</span>
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
              AI-based Fake Identity &amp; Document Screening System for Government &amp; Border Security. Built for Smart
              India Hackathon 2026.
            </p>
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-slate-500">
            <p className="mb-2 tracking-widest text-slate-400 uppercase">Security posture</p>
            <p>· AES-256 at rest · TLS 1.3 in transit</p>
            <p>· Append-only audit ledger</p>
            <p>· Zero-retention scan pipeline</p>
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-slate-500">
            <p className="mb-2 tracking-widest text-slate-400 uppercase">Stack</p>
            <p>· React 19 · Vite · Tailwind CSS 4</p>
            <p>· VeriDoc forensic engine v2.4.1</p>
            <p className="mt-3 text-amber-400/80">⚠ Simulated data — demonstration build</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 font-mono text-[10px] text-slate-600">
          <span>© 2026 Ministry of Home Affairs · Smart India Hackathon 2026 · Problem SIH26188</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [view, setView] = useState("scan");
  const [scan, setScan] = useState(null); // { result, url, useSample }
  // Every scan completed this session, in register + audit-log shapes, newest first.
  const [liveRows, setLiveRows] = useState({ register: [], audit: [] });

  const handleResult = (result, ctx) => {
    setScan({ result, ...ctx });
    setLiveRows((prev) => ({
      register: [liveRegisterRow(result), ...prev.register],
      audit: [liveAuditRow(result), ...prev.audit],
    }));
  };

  return (
    <div id="top" className="min-h-screen bg-ink">
      <Navbar view={view} onNavigate={setView} />

      <main className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        {view === "scan" && (
          <>
            <Hero />
           <div className="mt-8 min-h-[500px] pb-16">
              <Scanner onResult={handleResult} />
              {scan && (
                <ResultsView
                  key={scan.result.id}
                  result={scan.result}
                  previewUrl={scan.url}
                  sampleMode={scan.useSample}
                  onReset={() => setScan(null)}
                />
              )}
            </div>
          </>
        )}

        {view === "dashboard" && (
          <div className="mt-10">
            <Dashboard live={liveRows.register} />
          </div>
        )}
        {view === "analytics" && (
          <div className="mt-10">
            <TamperAnalytics />
          </div>
        )}
        {view === "audit" && (
          <div className="mt-10">
            <AuditLogs live={liveRows.audit} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}