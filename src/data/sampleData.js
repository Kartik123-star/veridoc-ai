export const DOC_TYPES = ["Aadhaar Card", "PAN Card", "Passport", "Voter ID"];

/* Convert an ISO scan timestamp into the register display format (local time,
   e.g. "2026-09-04 09:42:11") shared by the seeded sample rows. */
function stamp(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* Maps a finished forensic result onto a row for the Verification Dashboard
   register (same shape as sampleDocuments). */
export function liveRegisterRow(result) {
  return {
    id: result.id,
    type: result.docType,
    timestamp: stamp(result.scannedAt),
    officer: "Operator · Live Console",
    risk: result.verdict,
    score: result.score,
    live: true,
  };
}

/* Maps a finished forensic result onto an entry for the Audit Logs trail
   (same shape as auditLogs). */
export function liveAuditRow(result) {
  return {
    time: stamp(result.scannedAt),
    actor: "Operator · Live Console",
    action: result.invalid ? "Scan rejected at structural pre-screen" : "Forensic scan completed",
    docId: result.id,
    result: result.verdict,
    session: "TERM-LIVE · CONSOLE",
    ip: "127.0.0.1",
    live: true,
  };
}

export const METRICS = {
  totalScanned: 12847,
  counterfeits: 1203,
  avgTimeMs: 1124,
  avgScore: 86.4,
};

export const sampleDocuments = [
  { id: "VD-2026-04871", type: "Aadhaar Card", timestamp: "2026-09-04 09:42:11", officer: "SI A. Sharma", risk: "Authentic", score: 94 },
  { id: "VD-2026-04870", type: "Passport", timestamp: "2026-09-04 09:31:58", officer: "CI R. Menon", risk: "Counterfeit", score: 21 },
  { id: "VD-2026-04869", type: "PAN Card", timestamp: "2026-09-04 09:18:44", officer: "ASI P. Yadav", risk: "Authentic", score: 91 },
  { id: "VD-2026-04868", type: "Voter ID", timestamp: "2026-09-04 08:57:03", officer: "SI A. Sharma", risk: "Suspicious", score: 58 },
  { id: "VD-2026-04867", type: "Aadhaar Card", timestamp: "2026-09-04 08:41:27", officer: "Insp. D. Khan", risk: "Authentic", score: 96 },
  { id: "VD-2026-04866", type: "Passport", timestamp: "2026-09-04 08:22:19", officer: "CI R. Menon", risk: "Authentic", score: 88 },
  { id: "VD-2026-04865", type: "PAN Card", timestamp: "2026-09-04 07:58:52", officer: "SI T. Reddy", risk: "Counterfeit", score: 34 },
  { id: "VD-2026-04864", type: "Voter ID", timestamp: "2026-09-04 07:36:40", officer: "ASI P. Yadav", risk: "Authentic", score: 93 },
  { id: "VD-2026-04863", type: "Aadhaar Card", timestamp: "2026-09-04 07:12:08", officer: "Insp. D. Khan", risk: "Suspicious", score: 62 },
  { id: "VD-2026-04862", type: "Passport", timestamp: "2026-09-04 06:55:31", officer: "SI A. Sharma", risk: "Authentic", score: 90 },
  { id: "VD-2026-04861", type: "PAN Card", timestamp: "2026-09-04 06:41:09", officer: "ASI P. Yadav", risk: "Authentic", score: 89 },
  { id: "VD-2026-04860", type: "Aadhaar Card", timestamp: "2026-09-04 06:20:47", officer: "CI R. Menon", risk: "Counterfeit", score: 27 },
];

export const auditLogs = [
  { time: "2026-09-04 09:42:11", actor: "SI A. Sharma", action: "Forensic scan completed", docId: "VD-2026-04871", result: "Authentic", session: "TERM-04 · KSK-2", ip: "10.4.12.7" },
  { time: "2026-09-04 09:41:58", actor: "System", action: "Engine health check — all nodes OK", docId: "—", result: "OK", session: "AUTO", ip: "127.0.0.1" },
  { time: "2026-09-04 09:31:58", actor: "CI R. Menon", action: "Forensic scan completed", docId: "VD-2026-04870", result: "Counterfeit", session: "TERM-07 · BCP-1", ip: "10.4.12.14" },
  { time: "2026-09-04 09:28:14", actor: "SI A. Sharma", action: "Forensic PDF report exported", docId: "VD-2026-04870", result: "Counterfeit", session: "TERM-04 · KSK-2", ip: "10.4.12.7" },
  { time: "2026-09-04 09:18:44", actor: "ASI P. Yadav", action: "Forensic scan completed", docId: "VD-2026-04869", result: "Authentic", session: "TERM-02 · DEL-4", ip: "10.4.12.19" },
  { time: "2026-09-04 09:11:02", actor: "System", action: "Model weights updated → v2.4.1 (AUC 99.2%)", docId: "—", result: "OK", session: "AUTO", ip: "127.0.0.1" },
  { time: "2026-09-04 08:57:03", actor: "SI A. Sharma", action: "Forensic scan completed", docId: "VD-2026-04868", result: "Suspicious", session: "TERM-04 · KSK-2", ip: "10.4.12.7" },
  { time: "2026-09-04 08:52:40", actor: "Insp. D. Khan", action: "Watchlist cross-check triggered manual review", docId: "VD-2026-04868", result: "Suspicious", session: "TERM-09 · BCP-2", ip: "10.4.12.31" },
  { time: "2026-09-04 08:41:27", actor: "Insp. D. Khan", action: "Forensic scan completed", docId: "VD-2026-04867", result: "Authentic", session: "TERM-09 · BCP-2", ip: "10.4.12.31" },
  { time: "2026-09-04 08:22:19", actor: "CI R. Menon", action: "Forensic scan completed", docId: "VD-2026-04866", result: "Authentic", session: "TERM-07 · BCP-1", ip: "10.4.12.14" },
  { time: "2026-09-04 07:58:52", actor: "SI T. Reddy", action: "Forensic scan completed", docId: "VD-2026-04865", result: "Counterfeit", session: "TERM-03 · IGI-7", ip: "10.4.13.8" },
  { time: "2026-09-04 07:36:40", actor: "ASI P. Yadav", action: "Forensic scan completed", docId: "VD-2026-04864", result: "Authentic", session: "TERM-02 · DEL-4", ip: "10.4.12.19" },
  { time: "2026-09-04 07:12:08", actor: "Insp. D. Khan", action: "Forensic scan completed", docId: "VD-2026-04863", result: "Suspicious", session: "TERM-09 · BCP-2", ip: "10.4.12.31" },
  { time: "2026-09-04 06:55:31", actor: "SI A. Sharma", action: "Forensic scan completed", docId: "VD-2026-04862", result: "Authentic", session: "TERM-04 · KSK-2", ip: "10.4.12.7" },
  { time: "2026-09-04 06:48:00", actor: "System", action: "Automated nightly sweep — 2,184 docs re-scanned", docId: "—", result: "OK", session: "AUTO", ip: "127.0.0.1" },
  { time: "2026-09-04 06:30:12", actor: "System", action: "Encrypted audit DB backup verified", docId: "—", result: "OK", session: "AUTO", ip: "127.0.0.1" },
];

export const tamperByType = [
  { type: "Passport", rate: 21.4 },
  { type: "Aadhaar Card", rate: 12.8 },
  { type: "Voter ID", rate: 9.6 },
  { type: "PAN Card", rate: 6.2 },
];

export const trend = [
  { month: "Apr", count: 96 },
  { month: "May", count: 121 },
  { month: "Jun", count: 108 },
  { month: "Jul", count: 142 },
  { month: "Aug", count: 165 },
  { month: "Sep", count: 138 },
];

export const riskDistribution = { authentic: 78, suspicious: 15, counterfeit: 7 };

export const topTechniques = [
  { name: "Font mismatch on date-of-birth field", severity: "High", count: 312 },
  { name: "Profile photo edge splicing", severity: "High", count: 288 },
  { name: "Serial number overprint / ghosting", severity: "Medium", count: 197 },
  { name: "Stamp duplication artifact", severity: "Medium", count: 154 },
  { name: "Microprint degradation under laminate", severity: "Low", count: 121 },
];