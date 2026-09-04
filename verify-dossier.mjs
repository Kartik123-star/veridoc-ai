// verify-dossier.mjs — structural + text sanity check for the generated PDF.
import fs from "node:fs";
import zlib from "node:zlib";

const file = process.argv.slice(2).find((a) => !a.startsWith("-")) || "VeriDoc_AI_SIH26188_Dossier.pdf";
const s = fs.readFileSync(file, "latin1");

// --- decode all content streams -------------------------------------------
// Skip the binary comment line in the header (it can fake-match 'stream').
let idx = s.indexOf("\n", s.indexOf("\n") + 1) + 1;
const streams = {};
while ((idx = s.indexOf("stream", idx)) !== -1) {
  // Narrow window so it only spans the owning object's header, not earlier
  // objects (a page dict can precede its content stream in this writer).
  const head = s.slice(Math.max(0, idx - 120), idx);
  const om = /([0-9]+) 0 obj\s*$/m.exec(head);
  let start = idx + "stream".length;
  if (s[start] === "\r") start += 1;
  if (s[start] === "\n") start += 1;
  let end = s.indexOf("endstream", start);
  while (end > start && (s[end - 1] === "\n" || s[end - 1] === "\r")) end -= 1;
  if (om) {
    let raw = Buffer.from(s.slice(start, end), "latin1");
    if (/\/Filter \/Decode/.test(head) || /\/Filter \/FlateDecode/.test(head)) {
      try {
        raw = zlib.inflateSync(raw);
      } catch {
        /* leave raw */
      }
    }
    streams[om[1]] = raw.toString("latin1");
  }
  idx = end === -1 ? idx + 6 : end + "endstream".length;
}

// --- extract readable text from a content stream --------------------------
function textOf(body) {
  let out = "";
  const hexRe = /<([0-9a-fA-F]+)>/g;
  let m;
  while ((m = hexRe.exec(body)) !== null) {
    out += Buffer.from(m[1], "hex").toString("latin1");
  }
  const strRe = /\(((?:[^()\\]|\\.)*)\)/g;
  while ((m = strRe.exec(body)) !== null) {
    out += m[1].replace(/\\(.)/g, "$1");
  }
  return out;
}

// --- map pages to their content streams ------------------------------------
const pageRe = /([0-9]+) 0 obj\s*\n<<\n\/Type \/Page[^s][\s\S]*?\/Contents ([0-9]+) 0 R/g;
const pages = [];
let m;
while ((m = pageRe.exec(s)) !== null) pages.push({ page: m[1], content: m[2] });

const markers = [
  "Executive Overview",
  "System Architecture",
  "Screen Descriptions",
  "Development, Roadmap",
  "MISSING",
];

console.log("file:", file);
console.log("size:", fs.statSync(file).size, "bytes");
console.log("header:", s.startsWith("%PDF-") ? "ok" : "MISSING");
console.log("eof:", s.trimEnd().endsWith("%%EOF") ? "ok" : "MISSING");
console.log("has xref:", s.includes("xref") && /startxref\s+\d+/.test(s) ? "ok" : "MISSING");
console.log("page objects:", pages.length);
console.log("streams decoded:", Object.keys(streams).length);

let allNonEmpty = true;
for (const p of pages) {
  const text = textOf(streams[p.content] || "");
  const hits = markers.filter((k) => text.includes(k));
  console.log(
    "  page " + (pages.indexOf(p) + 1) + ": " + text.length + " chars | " + (hits.join(", ") || "NO SECTION MARKER")
  );
  if (!text) allNonEmpty = false;
}

if (process.argv.includes("--verbose")) {
  for (const p of pages) {
    const t = textOf(streams[p.content] || "");
    console.log(
      "  >>> page " + (pages.indexOf(p) + 1) + " starts with: " + JSON.stringify(t.slice(0, 160))
    );
  }
}
console.log("all pages have content:", allNonEmpty);

const all = Object.values(streams).map(textOf).join(" ");
for (const probe of ["VeriDoc", "SIH26188", "Aadhaar", "MRZ", "Photo", "CSV", "React 19", "28%", "12,847"]) {
  console.log("  contains [" + probe + "]:", all.includes(probe));
}