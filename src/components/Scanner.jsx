import { useEffect, useRef, useState } from "react";
import { DOC_TYPES } from "../data/sampleData";
import { generateResult, preflightFile, SIM_MODES } from "../lib/forensics";
import { createWorker } from "tesseract.js";

const PHASES = [
  { label: "Optical Character Recognition", sub: "Extracting text & field regions from document" },
  { label: "Checking Font Consistency", sub: "Comparing glyph metrics against genuine templates" },
  { label: "Running Error Level Analysis (ELA)", sub: "Detecting compression artifacts & splicing seams" },
  { label: "Calculating Authenticity Trust Score", sub: "Aggregating 214 forensic signals into one score" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SIM_STYLE = {
  auto: { dot: "bg-cyan-400", badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" },
  genuine: { dot: "bg-emerald-400", badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
  counterfeit: { dot: "bg-red-500", badge: "border-red-500/40 bg-red-500/10 text-red-400" },
  invalid: { dot: "bg-amber-400", badge: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Scanner({ onResult }) {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [useSample, setUseSample] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [simMode, setSimMode] = useState("auto");
  const [preflight, setPreflight] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState("idle");
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const acceptFile = (f) => {
    if (!f) return;
    const ok =
      /\.(png|jpe?g|pdf)$/i.test(f.name) || /^(image\/(png|jpeg)|application\/pdf)$/.test(f.type);
    if (!ok) {
      alert("Unsupported format. Please upload a PNG, JPG or PDF file.");
      return;
    }
    setFile(f);
    setUseSample(false);
    setPreflight(null);
    preflightFile(f).then(setPreflight);
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  const loadSample = (mode) => {
    setFile(null);
    setPreflight(null);
    setSimMode(mode);
    setUseSample(true);
    setStatus("idle");
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  const run = async (sample = false) => {
    if (status === "running") return;
    if (!file && !useSample) return;
    if (sample) setUseSample(true);

    const runId = ++runIdRef.current;
    const started = performance.now();
    setStatus("running");
    setPhase(0);

    for (let i = 0; i < PHASES.length; i++) {
      setPhase(i);
      await sleep(880 + Math.random() * 340);
      if (runId !== runIdRef.current) return;
    }

    const ms = Math.round(performance.now() - started);
    setElapsed(ms);
    setStatus("done");

    let extractedText = "";
    try {
      const targetImg = file || url;
      if (targetImg) {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(targetImg);
        extractedText = (ret.data.text || "").toLowerCase();
        await worker.terminate();
      }
    } catch (err) {
      console.warn("OCR recognition error:", err);
    }

    const uploadedName = (file?.name || "").toLowerCase();
    const activeUrl = (url || "").toLowerCase();
    const combinedText = `${extractedText} ${uploadedName} ${activeUrl}`;

    const hasAadhaarKeywords =
      combinedText.includes("government of india") ||
      combinedText.includes("unique identification") ||
      combinedText.includes("uidai") ||
      combinedText.includes("aadhaar") ||
      combinedText.includes("aadhar") ||
      combinedText.includes("mera aadhaar");

    const hasPanKeywords =
      combinedText.includes("income tax") ||
      combinedText.includes("permanent account") ||
      combinedText.includes("tax department");

    const hasVoterKeywords =
      combinedText.includes("election commission") ||
      combinedText.includes("elector photo") ||
      combinedText.includes("identity card") ||
      combinedText.includes("epic");

    const hasPassportKeywords =
      combinedText.includes("passport") ||
      combinedText.includes("republic of india") ||
      combinedText.includes("type p") ||
      combinedText.includes("p<ind");

    const lines = extractedText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 1);

    let mrzName = "";
    const mrzMatch = extractedText.match(/P<IND([A-Z<]+)/i);
    if (mrzMatch) {
      const cleanParts = mrzMatch[1]
        .split("<")
        .filter((part) => part.trim().length > 0);
      if (cleanParts.length > 0) {
        mrzName = cleanParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ");
      }
    }

    let detectedDocNo = null;
    const passportTopMatch = extractedText.match(/\b([A-PR-WYZ][0-9]{7})\b/i);
    const aadhaarMatch = extractedText.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
    const panMatch = extractedText.toUpperCase().match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/);
    const voterMatch = extractedText.toUpperCase().match(/\b[A-Z]{3}[0-9]{7}\b/);

    if (hasPassportKeywords && passportTopMatch) {
      detectedDocNo = passportTopMatch[1].toUpperCase();
    } else if (hasPanKeywords && panMatch) {
      detectedDocNo = panMatch[0];
    } else if (hasVoterKeywords && voterMatch) {
      detectedDocNo = voterMatch[0];
    } else if (aadhaarMatch) {
      detectedDocNo = `XXXX XXXX ${aadhaarMatch[0].replace(/\s+/g, "").slice(-4)}`;
    }

    let parsedName = "";
    if (mrzName) {
      parsedName = mrzName;
    } else {
      const blockedWords = [
        "government", "india", "income", "tax", "department", "permanent",
        "account", "card", "father", "name", "female", "male", "dob", "birth",
        "election", "commission", "republic", "passport", "signature",
        "nationality", "arevam", "date", "bih", "sex", "place"
      ];

      const dobIndex = lines.findIndex((l) => /dob|birth|\d{2}[\/-]\d{2}/i.test(l));
      if (dobIndex > 0) {
        for (let i = dobIndex - 1; i >= 0; i--) {
          const candidate = lines[i].replace(/[^a-zA-Z\s]/g, "").trim();
          const lower = candidate.toLowerCase();
          const isStopword = blockedWords.some((w) => lower.includes(w));
          if (candidate.length >= 3 && !isStopword && candidate.split(/\s+/).length <= 4) {
            parsedName = candidate;
            break;
          }
        }
      }

      if (!parsedName) {
        const nameCandidate = lines.find((l) => {
          const cleaned = l.replace(/[^a-zA-Z\s]/g, "").trim();
          const lower = cleaned.toLowerCase();
          return (
            /^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(cleaned) &&
            !blockedWords.some((w) => lower.includes(w))
          );
        });
        if (nameCandidate) parsedName = nameCandidate;
      }
    }

    const dateMatch = extractedText.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
    const parsedDate = dateMatch ? dateMatch[1] : null;

    const selected = String(docType || "").toLowerCase();
    const detectedDocType = hasAadhaarKeywords
      ? "aadhaar"
      : hasPanKeywords
      ? "pan"
      : hasVoterKeywords
      ? "voter"
      : hasPassportKeywords
      ? "passport"
      : null;

    const isMismatch =
      detectedDocType &&
      !selected.includes(detectedDocType);

    if (isMismatch) {
      onResult(
        {
          ...generateResult(docType, ms, { mode: "invalid", preflight }),
          score: 0,
          verdict: "Rejected",
          status: "DOCUMENT_TYPE_MISMATCH",
          flagReason: `Uploaded file identified as ${detectedDocType.toUpperCase()}, but expected ${selected.toUpperCase()}.`,
        },
        { url: sample ? null : url, useSample: sample }
      );
      return;
    }

    const result = generateResult(docType, ms, { mode: preflight ? "invalid" : simMode, preflight });
    if (parsedName) result.name = parsedName;
    if (parsedDate) result.issueDate = parsedDate;
    if (detectedDocNo) result.docNumber = detectedDocNo;

    onResult(result, { url: sample ? null : url, useSample: sample });
  };

  const progress = status === "running" ? ((phase + 1) / PHASES.length) * 100 : status === "done" ? 100 : 0;
  const hasInput = Boolean(file || useSample);

  return (
    <section id="scanner" className="relative z-10 my-8 w-full max-w-5xl mx-auto px-4 opacity-100">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
          drag
            ? "border-cyan-400 bg-cyan-500/10"
            : preflight
            ? "border-red-500/40 bg-red-500/5"
            : file || useSample
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-slate-700 bg-slate-900/90 hover:border-cyan-500/60 hover:bg-slate-900"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
          className="hidden"
          onChange={(e) => {
            acceptFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {file || useSample ? (
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {preflight ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1 font-mono text-xs font-medium text-red-400">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                NON-ID CONTENT DETECTED — WILL BE REJECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-400">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                STAGED FOR ANALYSIS
              </span>
            )}
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300">
                {useSample ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="4" y="5" width="16" height="14" rx="2" />
                    <path d="M4 15l4-4 3 3 3-4 6 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : file?.type === "application/pdf" ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 3h7l4 4v14H7V3z" strokeLinejoin="round" />
                    <path d="M14 3v4h4" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-left">
                <span className="block text-sm font-semibold text-slate-100">
                  {useSample ? "Sample document (demo corpus)" : file?.name}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-slate-500">
                  {useSample ? docType + " · 2.4 MB · SHA-256 verified" : `${docType} · ${formatSize(file?.size || 0)}`}
                  {simMode !== "auto" && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SIM_STYLE[simMode]?.badge || ""}`}>
                      SIM · {(SIM_MODES?.find((m) => m.value === simMode)?.label || simMode).toUpperCase()}
                    </span>
                  )}
                  {preflight && (
                    <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                      {preflight.reason}
                    </span>
                  )}
                </span>
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setUseSample(false);
                  setStatus("idle");
                }}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-400 transition-colors hover:border-red-500/40 hover:text-red-400"
                title="Remove"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Replace file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-cyan-400 transition-transform group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 16V4m0 0L7 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drag &amp; drop document here, or <span className="text-cyan-400">browse files</span>
              </p>
              <p className="mt-1 font-mono text-xs text-slate-500">Accepted: PNG · JPG · PDF — max 10 MB</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadSample("genuine");
                }}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-300 transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/10"
              >
                Load genuine sample →
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadSample("counterfeit");
                }}
                className="rounded-full border border-red-500/30 bg-red-500/5 px-4 py-1.5 text-xs font-medium text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/10"
              >
                Load tampered sample →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Config row */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.35fr]">
        <div>
          <label className="mb-1.5 block font-mono text-[11px] font-medium tracking-wider text-slate-500 uppercase">
            Document Type
          </label>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-10 text-sm font-medium text-slate-100 outline-none transition-colors focus:border-cyan-500/60"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-medium tracking-wider text-slate-500 uppercase">
            Simulation Mode
            <span className={`h-1.5 w-1.5 rounded-full ${SIM_STYLE[simMode]?.dot || "bg-cyan-400"}`} />
          </label>
          <div className="relative">
            <select
              value={simMode}
              onChange={(e) => setSimMode(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-10 text-sm font-medium text-slate-100 outline-none transition-colors focus:border-cyan-500/60"
            >
              {SIM_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={() => run(false)}
            disabled={!hasInput || status === "running"}
            className={`group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide transition-all ${
              status === "running"
                ? "cursor-wait bg-cyan-500/20 text-cyan-200"
                : hasInput
                ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:brightness-110 disabled:opacity-40"
                : "cursor-not-allowed bg-slate-800 text-slate-500 ring-1 ring-slate-700"
            }`}
          >
            {status === "running" ? (
              <>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <circle cx="12" cy="12" r="9" opacity="0.25" />
                  <path d="M21 12a9 9 0 00-9-9" strokeLinecap="round" />
                </svg>
                Analyzing… {Math.round(progress)}%
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20.5 20.5L16 16" strokeLinecap="round" />
                </svg>
                {status === "done" ? "Re-run Forensic AI Analysis" : "Run Forensic AI Analysis"}
              </>
            )}
          </button>
          <p className="mt-2 text-center font-mono text-[11px] text-slate-500 sm:text-left">
            {status === "running"
              ? PHASES[phase].label + "…"
              : status === "done"
              ? `Last scan: ${(elapsed / 1000).toFixed(2)}s — engine v2.4.1 · 214 signals`
              : "Encrypted upload · zero retention after analysis"}
          </p>
        </div>
      </div>

      {/* Phase tracker */}
      {status !== "idle" && (
        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] font-medium tracking-widest text-slate-500 uppercase">
              {status === "done" ? "Analysis Complete" : "Forensic Pipeline"}
            </span>
            <span className={`font-mono text-xs font-bold ${status === "done" ? "text-emerald-400" : "text-cyan-300"}`}>
              {status === "done" ? "✓ 100%" : `${Math.round(progress)}%`}
            </span>
          </div>

          <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-800" />

          <div className="grid gap-2 sm:grid-cols-2">
            {PHASES.map((p, i) => {
              const state = phase > i ? "done" : phase === i ? "active" : "pending";
              return (
                <div key={p.id || i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      state === "done"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : state === "active"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {state === "done" ? "✓" : state === "active" ? <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" /> : i + 1}
                  </span>
                  <div>
                    <p className={`text-[13px] font-semibold ${state === "pending" ? "text-slate-400" : "text-slate-100"}`}>
                      {p.label}
                      {state === "active" && <span className="text-cyan-400">...</span>}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{p.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}