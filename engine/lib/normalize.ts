import type { Gender } from "../types";

/** Parse messy age forms: "26", "Twenty-six.", 26, "[]", JSON-ish. */
const WORD_NUMS: Record<string, number> = {
  eighteen: 18, nineteen: 19, twenty: 20, "twenty-one": 21, "twenty-two": 22,
  "twenty-three": 23, "twenty-four": 24, "twenty-five": 25, "twenty-six": 26,
  "twenty-seven": 27, "twenty-eight": 28, "twenty-nine": 29, thirty: 30,
  "thirty-one": 31, "thirty-two": 32, "thirty-three": 33, "thirty-four": 34,
  "thirty-five": 35, "thirty-six": 36, "thirty-seven": 37, "thirty-eight": 38,
  "thirty-nine": 39, forty: 40, "forty-one": 41, "forty-two": 42,
  "forty-three": 43, "forty-four": 44, "forty-five": 45,
};

export function normalizeAge(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw >= 18 && raw <= 99 ? Math.round(raw) : null;
  }
  let s = String(raw).trim().toLowerCase();
  if (!s || s === "[]" || s === "{}" || s === "null") return null;
  // strip JSON brackets/quotes/punctuation
  s = s.replace(/["'\[\]{}().]/g, "").trim();
  // direct integer
  const m = s.match(/\b(\d{2})\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 18 && n <= 99) return n;
  }
  // word form
  const w = s.replace(/\s+/g, "-");
  if (WORD_NUMS[w] != null) return WORD_NUMS[w];
  // single word like "twenty"
  if (WORD_NUMS[s] != null) return WORD_NUMS[s];
  return null;
}

export function normalizeGender(...candidates: unknown[]): Gender | null {
  for (const c of candidates) {
    if (c == null) continue;
    const s = String(c).trim().toLowerCase();
    if (s === "man" || s === "male" || s === "m") return "man";
    if (s === "woman" || s === "female" || s === "f" || s === "w") return "woman";
  }
  return null;
}

/** dating_preference is stored as the gender wanted ("man"/"woman"). */
export function normalizeDatingPref(raw: unknown): Gender | null {
  return normalizeGender(raw);
}

/** Azure masculine_feminine_signal can be a number, string, or object. → -1..1 */
export function normalizeMascFem(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return clamp(raw, -1, 1);
  if (typeof raw === "object") {
    const o = raw as any;
    const v = o.signal ?? o.value ?? o.score ?? o.masculine ?? null;
    if (typeof v === "number") return clamp(v, -1, 1);
  }
  const s = String(raw).toLowerCase();
  if (s.includes("masculine")) return 0.6;
  if (s.includes("feminine")) return -0.6;
  const n = Number(s);
  return Number.isFinite(n) ? clamp(n, -1, 1) : null;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** trust_status / stage based "active & datable" check. */
export function isActiveDatable(trustRaw: any, stage: string | null, relStatus: string | null): boolean {
  const rel = (relStatus || "").toLowerCase();
  if (rel.includes("relationship") || rel.includes("married") || rel.includes("engaged") || rel.includes("taken")) {
    return false;
  }
  const st = (stage || "").toLowerCase();
  if (st.includes("blocked") || st.includes("withdrawn") || st.includes("banned") || st.includes("deleted")) {
    return false;
  }
  return true;
}

/** Pull a short career/profession summary from persona life_stage / self_text / linkedin. */
export function deriveCareer(lifeStageText: string | null, selfText: string | null, linkedin: string | null): string | null {
  const parts: string[] = [];
  const grab = (t: string | null) => {
    if (!t) return;
    for (const seg of t.split(/[,;]/)) {
      const s = seg.trim();
      if (/\b(work|works|working|job|career|founder|engineer|doctor|designer|student|manager|analyst|lawyer|teacher|consultant|pm|developer|artist|writer|entrepreneur|studies|studying)\b/i.test(s)) {
        parts.push(s);
      }
    }
  };
  grab(lifeStageText);
  grab(selfText);
  if (linkedin) parts.push(`linkedin:${linkedin}`);
  const uniq = [...new Set(parts)].slice(0, 5);
  return uniq.length ? uniq.join("; ") : null;
}
