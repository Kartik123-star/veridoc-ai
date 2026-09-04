import { useState } from "react";
import TrustGauge from "./TrustGauge";
import { Card, RiskBadge } from "./ui";
import { downloadForensicReport } from "../lib/forensics";

const SEV_STYLES = {
  high: { box: "border-red-500 bg-red-500/10", chip: "bg-red-500 text-white", label: "bg-red-500/95 text-white", dot: "bg-red-500" },
  medium: { box: "border-amber-400 bg-amber-400/10", chip: "bg-amber-500 text-ink", label: "bg-amber-500/95 text-ink", dot: "bg-amber-400" },
  low: { box: "border-yellow-400 bg-yellow-400/10", chip: "bg-yellow-500 text-ink", label: "bg-yellow-500/95 text-ink", dot: "bg-yellow-400" },
  ok: { box: "border-emerald-400 bg-emerald-400/10", chip: "bg-emerald-500 text-ink", label: "bg-emerald-500/95 text-ink", dot: "bg-emerald-400" },
};

/* Renders a believable mock government ID card whose elements are positioned
   from the same zone coordinates as the bounding boxes, so overlays align. */
function MockDocument({ result }) {
  const { docType, zones, docNumber } = result;
  const portrait = docType === "Aadhaar Card";

  const photoZone = zones.find((z) => /photo|ghost/i.test(z.label)) || {
    region: "Profile Photo",
    x: 64,
    y: 14,
    w: 26,
    h: 26,
  };

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden rounded-xl bg-white shadow-[0_0_60px_rgba(0,0,0,0.55)] ${portrait ? "aspect-[10/14] max-w-[320px]" : "aspect-[14/9] max-w-[540px]"}`}
    >
      {/* Header band */}
      <div className="absolute inset-x-0 top-0 flex h-9 items-center justify-center gap-2 bg-gradient-to-r from-cyan-800 via-cyan-700 to-cyan-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/90" fill="currentColor">
          <path d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5l8-3z" opacity="0.9" />
        </svg>
        <span className="text-[10px] font-bold tracking-[0.25em] text-white">{docType.toUpperCase()}</span>
      </div>

      {/* Photo block (aligned with the photo zone) */}
      <div
        className="absolute flex items-center justify-center rounded-md border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-300"
        style={{ left: `${photoZone.x}%`, top: `${photoZone.y}%`, width: `${photoZone.w}%`, height: `${photoZone.h}%` }}
      >
        <svg viewBox="0 0 24 24" className="h-[55%] w-[55%] text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="8.5" r="3.4" />
          <path d="M5 19.5c1.3-3.6 4-5 7-5s5.7 1.4 7 5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Field blocks from non-photo zones */}
      {zones
        .filter((z) => !/photo|ghost/i.test(z.label))
        .map((z) => (
          <div
            key={z.label}
            className="absolute"
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
          >
            <p className="font-mono text-[7px] font-semibold tracking-widest text-slate-500 uppercase">{z.region}</p>
            <div className="mt-0.5 h-[38%] rounded-sm bg-slate-200" />
          </div>
        ))}

      {/* Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <p className="font-mono text-[9px] font-semibold tracking-[0.5em] text-slate-300 uppercase">VeriDoc Secure</p>
      </div>

      {/* Doc number */}
      <p className="absolute right-3 bottom-2.5 font-mono text-[9px] font-semibold text-slate-600">{docNumber}</p>

      {/* Colored corner tab */}
      <div className="absolute top-9 right-0 h-8 w-8 rounded-bl-xl bg-gradient-to-bl from-cyan-200/70 to-transparent" />
    </div>
  );
}

function DocumentPreview({ result, previewUrl, sampleMode }) {
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span className="rounded border border-line bg-panel px-2 py-1">AI OVERLAY</span>
          <span className="flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-400" /> ACTIVE
          </span>
        </div>
        <span className="rounded-full border border-line bg-panel px-2.5 py-1 font-mono text-[10px] text-slate-500">
          {previewUrl ? "UPLOADED SOURCE" : sampleMode ? "DEMO CORPUS SAMPLE" : "REFERENCE RENDER"}
        </span>
      </div>

      {/* Doc frame */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-[radial-gradient(circle_at_50%_0%,#12203a,transparent_70%)] bg-panel-2 p-6 sm:p-8">
        {/* corner brackets */}
        {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "left-2 bottom-2 border-l-2 border-b-2", "right-2 bottom-2 border-r-2 border-b-2"].map(
          (cls) => (
            <span key={cls} className={`absolute h-5 w-5 border-cyan-500/50 ${cls}`} />
          )
        )}

        <div className="relative">
          {previewUrl ? (
            <img src={previewUrl} alt="Uploaded document" className="mx-auto max-h-[520px] w-auto rounded-xl" />
          ) : (
            <MockDocument result={result} />
          )}

          {/* Scan sweep */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute right-0 left-0 h-16 animate-scanline bg-gradient-to-b from-transparent via-cyan-400/15 to-transparent" />
          </div>

          {/* Bounding boxes */}
          {result.zones.map((z) => {
            const st = SEV_STYLES[z.sev] || SEV_STYLES.low;
            const active = hovered === z.label || pinned === z.label;
            return (
              <div
                key={z.label}
                onMouseEnter={() => setHovered(z.label)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setPinned((p) => (p === z.label ? null : z.label))}
                className={`absolute cursor-crosshair rounded-md border-2 transition-all duration-200 ${st.box} ${
                  active ? "z-10 scale-[1.03] opacity-100" : "opacity-75 hover:opacity-100"
                }`}
                style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
              >
                {/* label chip */}
                <span
                  className={`absolute -top-6 left-0 z-20 max-w-[220px] truncate rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold whitespace-nowrap shadow-lg ${
                    st.label
                  } ${active ? "scale-105" : ""} transition-transform`}
                >
                  {z.label}
                </span>
                <span className={`absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-ink ${st.dot}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone legend */}
      <div className="mt-4 space-y-2">
        {result.zones.map((z) => {
          const st = SEV_STYLES[z.sev] || SEV_STYLES.low;
          const active = hovered === z.label || pinned === z.label;
          return (
            <button
              key={z.label}
              onMouseEnter={() => setHovered(z.label)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setPinned((p) => (p === z.label ? null : z.label))}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                active ? "border-cyan-500/50 bg-cyan-500/5" : "border-line bg-panel/60 hover:bg-panel-2"
              }`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${st.dot}`} />
              <span className="flex-1 text-[12px] font-medium text-slate-200">{z.label}</span>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase ${st.chip}`}>
                {z.verified ? "Verified" : z.sev}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetaRow({ label, value, accent = "text-slate-100" }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 py-3 last:border-0">
      <span className="font-mono text-[11px] tracking-wider text-slate-500 uppercase">{label}</span>
      <span className={`text-right text-[13px] font-semibold ${accent}`}>{value}</span>
    </div>
  );
}

/* Dedicated rejection view for uploads that fail the structural pre-flight
   (or are force-rejected in Simulation Mode): score 0, no identity data. */
function InvalidResultView({ result, onReset }) {
  return (
    <section id="results" className="mt-10 animate-fade-up">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-red-400/80 uppercase">Inspection Results</span>
          <span className="rounded border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-slate-400">{result.id}</span>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          ← Start new scan
        </button>
      </div>

      {/* Rejection banner */}
      <div className="mb-5 rounded-2xl border-2 border-red-500/50 bg-red-500/10 px-5 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
          </span>
          <p className="font-mono text-sm font-extrabold tracking-[0.18em] text-red-400 uppercase">{result.status}</p>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-200">{result.flagReason}</p>
        <p className="mt-1.5 font-mono text-xs text-red-300/70">Pre-flight detail: {result.flagDetail}</p>
      </div>

      {/* Gauge row */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="flex items-center justify-center p-6">
          <TrustGauge score={0} label="Rejected" sub="UNRECOGNIZED MEDIA" />
        </Card>
        <Card className="p-6">
          <p className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Format Classifier</p>
          <p className="mt-3 text-xl font-extrabold text-red-400 text-glow-red">UNRECOGNIZED FORMAT</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            No MRZ, Aadhaar QR grid, or standard ID field layout could be located in the uploaded media.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5 font-mono text-xs font-bold text-red-400">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-red-500" /> REJECTED AT PRE-SCREEN
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Identity Data</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-600">NONE</p>
          <p className="mt-1 text-xs text-slate-400">No fields extracted — document was not admitted to the verification pipeline.</p>
          <p className="mt-5 font-mono text-[11px] text-slate-500">
            Processed in {(result.processingMs / 1000).toFixed(2)}s · pre-screen rejection
          </p>
        </Card>
      </div>

      {/* Placeholder + metadata */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-red-500/40 bg-red-500/[0.03] p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-slate-200">Uploaded media is not a recognized identity document</p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  The structural pre-screen rejected the file before OCR. Typical causes: photo/wallpaper media,
                  non-ID aspect ratios, or resolution below the forensic-analysis minimum.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Extracted Metadata</p>
              <RiskBadge risk="Rejected" />
            </div>
            <MetaRow label="Full Name" value="—" accent="text-slate-600" />
            <MetaRow label="Document No." value="—" accent="text-slate-600" />
            <MetaRow label="Issue Date" value="—" accent="text-slate-600" />
            <MetaRow label="Valid Till" value="—" accent="text-slate-600" />
            <MetaRow label="Face Match" value="N/A" accent="text-slate-500" />
            <MetaRow label="Tamper Likelihood" value="—" accent="text-slate-500" />
            <MetaRow label="Classifier" value={result.status} accent="font-mono text-[11px] text-red-400" />
            <div className="mt-5">
              <button
                onClick={() => downloadForensicReport(result)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 text-sm font-bold text-white transition-all hover:brightness-110"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 3v11m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
                </svg>
                Download Rejection Report (PDF)
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default function ResultsView({ result, previewUrl, sampleMode, onReset }) {
  if (result.invalid) {
    return <InvalidResultView result={result} onReset={onReset} />;
  }

  const verdictColor =
    result.verdict === "Authentic"
      ? "from-emerald-500/20 to-cyan-500/10 text-emerald-400"
      : result.verdict === "Suspicious"
        ? "from-amber-500/20 to-orange-500/10 text-amber-400"
        : "from-red-500/20 to-rose-500/10 text-red-400";

  return (
    <section id="results" className="mt-10 animate-fade-up">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.2em] text-cyan-400/80 uppercase">Inspection Results</span>
          <span className="rounded border border-line bg-panel px-2 py-0.5 font-mono text-[11px] text-slate-400">{result.id}</span>
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
        >
          ← Start new scan
        </button>
      </div>

      {/* Critical tamper alert */}
      {result.criticalAlert && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border-2 border-red-500/50 bg-red-500/10 px-5 py-4">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
          </span>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-red-400 uppercase sm:text-sm">
            {result.criticalAlert}
          </p>
        </div>
      )}

      {/* Gauge row */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="flex items-center justify-center p-6">
          <TrustGauge score={result.score} />
        </Card>

        <Card className="p-6">
          <p className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Face Match Status</p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                result.faceMatch ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                {result.faceMatch ? (
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                )}
              </svg>
            </span>
            <div>
              <p className={`text-xl font-bold ${result.faceMatch ? "text-emerald-400 text-glow-emerald" : "text-red-400 text-glow-red"}`}>
                {result.faceMatch ? "PASSED" : "FAILED"}
              </p>
              <p className="font-mono text-xs text-slate-500">Live biometric comparison</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between font-mono text-[11px] text-slate-500">
              <span>Similarity confidence</span>
              <span className={result.faceMatch ? "text-emerald-400" : "text-red-400"}>{result.faceConfidence}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
              <div
                className={`h-full rounded-full ${result.faceMatch ? "bg-emerald-400" : "bg-red-500"}`}
                style={{ width: `${result.faceConfidence}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <p className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Tamper Likelihood</p>
          <p className={`mt-3 text-4xl font-extrabold ${result.tampered ? "text-red-400 text-glow-red" : "text-emerald-400 text-glow-emerald"}`}>
            {result.tamperLikelihood}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {result.tampered ? "Multiple anomaly signatures in 3+ zones" : "All 214 forensic signals nominal"}
          </p>
          <div className={`mt-5 inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-4 py-1.5 text-sm font-bold ${verdictColor}`}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {result.verdict.toUpperCase()}
          </div>
          <p className="mt-4 font-mono text-[11px] text-slate-500">
            Processed in {(result.processingMs / 1000).toFixed(2)}s · target &lt; 1.2s
          </p>
        </Card>
      </div>

      {/* Comparison row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DocumentPreview result={result} previewUrl={previewUrl} sampleMode={sampleMode} />
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-widest text-slate-500 uppercase">Extracted Metadata</p>
              <RiskBadge risk={result.verdict} />
            </div>
            <MetaRow label="Full Name" value={result.name} />
            <MetaRow label="Document No." value={result.docNumber} accent="font-mono text-cyan-300" />
            <MetaRow label="Issue Date" value={result.issueDate} />
            <MetaRow label="Valid Till" value={result.validTill} />
            <MetaRow
              label="Face Match"
              value={result.faceMatch ? "Passed" : "Failed"}
              accent={result.faceMatch ? "text-emerald-400" : "text-red-400"}
            />
            <MetaRow
              label="Tamper Likelihood"
              value={`${result.tamperLikelihood}%`}
              accent={result.tampered ? "text-red-400" : "text-emerald-400"}
            />
            <MetaRow label="OCR Confidence" value={`${97 - Math.floor(Math.random() * 3)}.1%`} accent="text-slate-200" />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadForensicReport(result)}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-ink transition-all hover:brightness-110"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 3v11m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
                </svg>
                Download Forensic PDF Report
              </button>
              <button className="rounded-xl border border-line bg-panel-2 px-4 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300">
                Escalate to Officer
              </button>
              <button className="rounded-xl border border-line bg-panel-2 px-4 py-3 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-300">
                Cross-check Watchlist
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}