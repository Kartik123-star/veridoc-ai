
// outcome, plus a structural pre-flight that rejects uploads which are clearly
// not identity documents (filename signal + image dimensions / aspect ratio).

const FIRST = ["Arjun", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Rohan", "Kavya", "Aditya", "Meera", "Sanjay", "Isha", "Karan", "Divya", "Nikhil", "Tanvi"];
const LAST = ["Mehta", "Iyer", "Sharma", "Reddy", "Khan", "Patel", "Nair", "Singh", "Verma", "Das", "Joshi", "Rao", "Gupta", "Menon", "Bose", "Chowdhury"];

const ZONES_BY_TYPE = {
  "Aadhaar Card": [
    { region: "Profile Photo", label: "Altered Profile Photo Edges", x: 64, y: 14, w: 26, h: 26, sev: "high" },
    { region: "Date of Birth", label: "Mismatched Font on DOB", x: 8, y: 54, w: 40, h: 11, sev: "high" },
    { region: "QR Code", label: "QR Microprint Degradation", x: 8, y: 70, w: 20, h: 13, sev: "medium" },
    { region: "Serial Number", label: "Ghost Overprint on Serial", x: 32, y: 62, w: 26, h: 7, sev: "low" },
  ],
  "PAN Card": [
    { region: "Profile Photo", label: "Photo Splicing at Left Edge", x: 6, y: 16, w: 22, h: 34, sev: "high" },
    { region: "Date of Birth", label: "Mismatched Font on DOB", x: 32, y: 42, w: 34, h: 12, sev: "high" },
    { region: "Signature", label: "Signature Tonal Irregularity", x: 36, y: 70, w: 20, h: 9, sev: "medium" },
    { region: "PAN Number", label: "Character Distortion in PAN No.", x: 62, y: 22, w: 22, h: 9, sev: "medium" },
  ],
  Passport: [
    { region: "Profile Photo", label: "Altered Photo & Ghost Image", x: 66, y: 12, w: 24, h: 34, sev: "high" },
    { region: "MRZ", label: "MRZ Ink Bleed / Re-print", x: 14, y: 78, w: 62, h: 9, sev: "high" },
    { region: "Laminate", label: "Microprint Loss Under Laminate", x: 8, y: 48, w: 30, h: 10, sev: "medium" },
    { region: "Document Number", label: "Check-Digit Mismatch", x: 16, y: 34, w: 26, h: 8, sev: "low" },
  ],
  "Voter ID": [
    { region: "Profile Photo", label: "Photo Re-lamination Artifact", x: 6, y: 16, w: 20, h: 30, sev: "high" },
    { region: "Name", label: "Name Field Font Mismatch", x: 32, y: 20, w: 40, h: 9, sev: "high" },
    { region: "Serial Number", label: "Electoral Roll Serial Tampering", x: 34, y: 60, w: 28, h: 8, sev: "medium" },
    { region: "Watermark", label: "Watermark Duplication", x: 56, y: 72, w: 28, h: 9, sev: "low" },
  ],
};

const NUMBER_PATTERNS = {
  "Aadhaar Card": () => `XXXX XXXX ${String(1000 + Math.floor(Math.random() * 9000))}`,
  "PAN Card": () => {
    const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
    let s = "";
    for (let i = 0; i < 3; i++) s += letters[Math.floor(Math.random() * letters.length)];
    s += letters[0];
    return `${s}${String(1000 + Math.floor(Math.random() * 9000))}${letters[Math.floor(Math.random() * letters.length)]}`;
  },
  Passport: () => `M${String(400000 + Math.floor(Math.random() * 400000))}`,
  "Voter ID": () => `ABC${String(100000 + Math.floor(Math.random() * 800000))}`,
};

export const SIM_MODES = [
  { value: "auto", label: "Auto-Detect" },
  { value: "genuine", label: "Force Genuine (Pass)" },
  { value: "counterfeit", label: "Force Counterfeit / Tampered (Fail)" },
  { value: "invalid", label: "Force Invalid Document (Reject)" },
];

const INVALID_STATUS = "INVALID DOCUMENT / UNRECOGNIZED FORMAT";
const INVALID_FLAG_REASON = "No standard ID layout, MRZ, or Aadhaar QR pattern detected.";

// Filename signals that strongly suggest the upload is not an identity document.
const NON_ID_KEYWORDS = ["chess", "random", "wallpaper", "cat", "meme", "selfie", "nature", "food", "avatar", "mountain", "dog"];

// Card-like geometry: Aadhaar ≈ 0.70, PAN ≈ 1.59, Passport ≈ 1.42, Voter ID ≈ 1.59.
const MIN_RATIO = 0.55;
const MAX_RATIO = 2.3;
const MIN_SIDE = 200;
const MAX_PIXELS = 25_000_000; // poster / wallpaper-scale media

function randDate(fromYear, toYear) {
  const y = fromYear + Math.floor(Math.random() * (toYear - fromYear + 1));
  const m = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const d = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  return `${d}-${m}-${y}`;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function meta(docType) {
  return {
    id: `VD-2026-0${String(4850 + Math.floor(Math.random() * 150))}`,
    docType,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    docNumber: NUMBER_PATTERNS[docType](),
    issueDate: randDate(2014, 2024),
    validTill: docType === "Passport" ? randDate(2030, 2035) : "Lifetime",
  };
}

async function readImageDims(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      const dims = { width: bmp.width, height: bmp.height };
      bmp.close();
      return dims;
    } catch {
      /* fall through to <img> decode */
    }
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Structural pre-flight check run as soon as a file is dropped / picked.
 * Returns null when the upload plausibly is an ID document, otherwise a
 * { reason, detail } object describing why it was flagged for rejection.
 */
export async function preflightFile(file) {
  try {
    const lower = file.name.toLowerCase();
    const hit = NON_ID_KEYWORDS.find((k) => lower.includes(k));
    if (hit) {
      return {
        reason: `Filename signal "${hit}"`,
        detail: `Filename "${file.name}" matches non-ID media patterns`,
      };
    }

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      const dims = await readImageDims(file);
      if (!dims) {
        return { reason: "Image decode failure", detail: "The file could not be decoded as a valid image" };
      }
      const { width, height } = dims;
      const ratio = width / height;
      if (width < MIN_SIDE || height < MIN_SIDE) {
        return {
          reason: `Resolution too low (${width}×${height})`,
          detail: "Identity documents require at least 200 px per side for OCR and ELA",
        };
      }
      if (width * height > MAX_PIXELS) {
        return {
          reason: `Resolution atypical (${width}×${height})`,
          detail: "Dimensions suggest poster or wallpaper media rather than a card scan",
        };
      }
      if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
        return {
          reason: `Atypical aspect ratio ${ratio.toFixed(2)}:1`,
          detail: `Dimensions ${width}×${height} do not match any ID card geometry`,
        };
      }
    }
    return null;
  } catch {
    return null; // never block the demo on pre-flight edge cases
  }
}

function buildInvalidResult(docType, processingMs, preflight) {
  return {
    id: `VD-2026-0${String(4850 + Math.floor(Math.random() * 150))}`,
    docType,
    name: "—",
    docNumber: "—",
    issueDate: "—",
    validTill: "—",
    faceMatch: false,
    faceConfidence: 0,
    score: 0,
    verdict: "Rejected",
    status: INVALID_STATUS,
    invalid: true,
    flagReason: INVALID_FLAG_REASON,
    flagDetail: preflight
      ? preflight.detail
      : "Simulation mode forced rejection of the uploaded media.",
    tampered: false,
    tamperLikelihood: 0,
    zones: [],
    processingMs: Math.max(processingMs, 900),
    scannedAt: new Date().toISOString(),
  };
}

function buildGenuine(docType, processingMs) {
  const zones = ZONES_BY_TYPE[docType].map((z) => ({
    ...z,
    sev: "ok",
    verified: true,
    label: `${z.region} — All Checks Passed`,
  }));
  return {
    ...meta(docType),
    faceConfidence: 96,
score: 96,
verdict: "Authentic",
tampered: false,
tamperLikelihood: 3,
    zones,
    processingMs: Math.max(processingMs, 900),
    scannedAt: new Date().toISOString(),
  };
}

function buildCounterfeit(docType, processingMs) {
  // Flag exactly the two critical zones: profile photo + DOB (or closest pair).
  const zones = ZONES_BY_TYPE[docType]
    .filter((z) => z.sev === "high")
    .slice(0, 2)
    .map((z) => ({ ...z, sev: "high" }));
  return {
    ...meta(docType),
    faceMatch: false,
    faceConfidence: 34,
    score: 28,
    verdict: "Counterfeit",
    tampered: true,
    tamperLikelihood: 94,
    zones,
    criticalAlert: "CRITICAL TAMPER DETECTED: Spliced photo & font mismatch",
    processingMs: Math.max(processingMs, 900),
    scannedAt: new Date().toISOString(),
  };
}

function buildAuto(docType, processingMs) {
  // Check if docType indicates counterfeit/sample fail
  const isSuspicious = String(docType).toLowerCase().includes("tamper") || String(docType).toLowerCase().includes("fake");
  const tampered = isSuspicious;
  const score = tampered ? 32 : 96;
  const facePassed = !tampered;
  const verdict = tampered ? "Counterfeit" : "Authentic";
  const rawZones = ZONES_BY_TYPE[docType];
  const zones = tampered
   ? rawZones.slice(0, 2)
    : rawZones.map((z) => ({
        ...z,
        sev: "ok",
        verified: true,
        label: `${z.region} — All Checks Passed`,
      }));

  return {
    ...meta(docType),
    faceMatch: facePassed,
   faceConfidence: facePassed ? 96 : 42,
    score,
    verdict,
    tampered,
    tamperLikelihood: tampered ? 88 : 3,
    zones,
    processingMs: Math.max(processingMs, 900),
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Runs the simulated analysis. opts:
 *   mode      — one of SIM_MODES values; forces the outcome for the demo.
 *   preflight — result of preflightFile(); when set, the upload is rejected
 *               regardless of the simulation mode (structural check wins).
 */
export function generateResult(docType, processingMs, opts = {}) {
  const { mode = "auto", preflight = null } = opts;

  if (preflight || mode === "invalid") {
    return buildInvalidResult(docType, processingMs, preflight);
  }
  if (mode === "genuine") return buildGenuine(docType, processingMs);
  if (mode === "counterfeit") return buildCounterfeit(docType, processingMs);
  return buildAuto(docType, processingMs);
}

function esc(s) {
  return String(s).replace(/[\\()]/g, (c) => "\\" + c);
}

/**
 * Builds a minimal, valid one-page PDF (hand-assembled, ASCII-only so string
 * length == byte length for correct xref offsets) and triggers a download.
 */
export function downloadForensicReport(doc) {
  const verdictColor =
    doc.verdict === "Authentic"
      ? "0.05 0.55 0.35"
      : doc.verdict === "Suspicious"
        ? "0.85 0.55 0.1"
        : "0.85 0.15 0.15";

  const content = [
    { t: "VeriDoc AI - MHA Border Screening", x: 50, y: 790, s: 15, c: "0.10 0.30 0.55", b: true },
    { t: "Forensic Examination Report", x: 50, y: 770, s: 11, c: "0.30 0.35 0.45" },
    { t: "Generated: " + new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC", x: 50, y: 754, s: 8, c: "0.45 0.45 0.45" },
    { t: "", x: 50, y: 740, s: 9, c: "0.4 0.4 0.4" },
    { t: "Document ID     : " + doc.id, x: 50, y: 722, s: 10, c: "0.1 0.1 0.1" },
    { t: "Document Type   : " + doc.docType, x: 50, y: 706, s: 10, c: "0.1 0.1 0.1" },
    { t: "Holder Name     : " + doc.name, x: 50, y: 690, s: 10, c: "0.1 0.1 0.1" },
    { t: "Document Number : " + doc.docNumber, x: 50, y: 674, s: 10, c: "0.1 0.1 0.1" },
    { t: "Issue Date      : " + doc.issueDate, x: 50, y: 658, s: 10, c: "0.1 0.1 0.1" },
    { t: "Valid Till      : " + doc.validTill, x: 50, y: 642, s: 10, c: "0.1 0.1 0.1" },
    { t: "Face Match      : " + (doc.faceMatch ? "PASSED" : "FAILED"), x: 50, y: 626, s: 10, c: doc.faceMatch ? "0.05 0.55 0.35" : "0.85 0.15 0.15" },
    { t: "Authenticity    : " + doc.score + "%", x: 50, y: 610, s: 10, c: "0.1 0.1 0.1" },
    { t: "VERDICT         : " + doc.verdict.toUpperCase(), x: 50, y: 590, s: 13, c: verdictColor, b: true },
    { t: "", x: 50, y: 572, s: 9, c: "0.4 0.4 0.4" },
    { t: "Tamper Analysis Zones", x: 50, y: 556, s: 11, c: "0.10 0.30 0.55", b: true },
  ];

  (doc.zones || []).slice(0, 4).forEach((z, i) => {
    const y = 538 - i * 22;
    const sevColor = z.sev === "high" ? "0.85 0.15 0.15" : z.sev === "medium" ? "0.85 0.55 0.1" : z.sev === "low" ? "0.65 0.65 0.2" : "0.05 0.55 0.35";
    content.push({ t: "[" + (i + 1) + "] " + z.label + "  (" + (z.verified ? "VERIFIED" : z.sev.toUpperCase()) + ")", x: 60, y, s: 9, c: sevColor });
  });

  content.push(
    { t: "", x: 50, y: 440, s: 9, c: "0.4 0.4 0.4" },
    { t: "Processing time : " + ((doc.processingMs || 1100) / 1000).toFixed(2) + "s (target < 1.2s)", x: 50, y: 422, s: 9, c: "0.2 0.2 0.2" },
    { t: "Engine          : VeriDoc AI v2.4.1 (OCR + font forensics + ELA + face biometrics)", x: 50, y: 406, s: 9, c: "0.2 0.2 0.2" },
    { t: "This report was generated automatically by the VeriDoc AI forensic engine.", x: 50, y: 82, s: 8, c: "0.45 0.45 0.45" },
    { t: "VeriDoc AI v2.4.1  |  Bureau of Immigration, MHA  |  Smart India Hackathon 2026 (SIH26188)", x: 50, y: 68, s: 8, c: "0.45 0.45 0.45" }
  );

  const stream = content
    .map((l) => {
      let s = (l.b ? "/F2 " : "/F1 ") + l.s + " Tf ";
      s += l.c + " rg ";
      s += "1 0 0 1 " + l.x + " " + l.y + " Tm (" + esc(l.t) + ") Tj";
      return s;
    })
    .join("\n");

  const objs = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    "6 0 obj\n<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o) => {
    offsets.push(pdf.length);
    pdf += o;
  });
  const xrefStart = pdf.length;
  pdf += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n";
  offsets.forEach((off) => {
    pdf += String(off).padStart(10, "0") + " 00000 n \n";
  });
  pdf += "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefStart + "\n%%EOF";

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Forensic-Report-${doc.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
