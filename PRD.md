# Wingy — Matchmaking Dashboard & Engine
### Product Requirements Document (v1)

**Author:** subhayudas · **Date:** 2026-06-18 · **Status:** Draft for review

---

## 1. Summary

Build a **next-level matchmaking dashboard** backed by a **custom matchmaking engine** that produces only **mutual best matches**. The engine ignores any pre-existing/legacy scores and instead computes its **own** compatibility from raw user data, judged on four factors — **attraction, background, career, age** — passed through an **LLM reasoning filter (Claude)**. Matching is **directional and gender-aware**, enforces **hard eligibility gates** (must have a face/visual score and persona data), and only confirms a pair when the preference is **mutual** (both people rank each other as a top available choice).

The full matchmaking run executes **once as a batch pipeline**, and results are stored in **Neon Postgres**. The **dashboard** (Next.js web app) reads pre-computed results and provides rich filtering, search, and per-match reasoning.

---

## 2. Goals & Non-Goals

### Goals
1. Produce **high-quality, mutual** matches only — no one-sided matches.
2. **Remove users with no usable data** (no face/visual profile, no persona) before matching.
3. Compute a **custom compatibility score** (0–1) from raw user data — not legacy `compatibility`/`usersmatchmaker` scores.
4. Apply **gender-asymmetric logic** for career weighting and **directional age-gap rules**.
5. Run every surviving candidate pair through an **LLM reasoning filter** that both *filters* and *explains*.
6. Persist results **once** to Neon; the dashboard is a fast read-only view over them.
7. Provide a **premium dashboard** with filtering (best matches, by name, gender, score, status, etc.), search, and full match reasoning.

### Non-Goals (v1)
- Real-time / on-demand recomputation in the dashboard (batch only).
- Messaging, intros, or delivery to users (the existing Wingy system handles outreach).
- Editing source profiles from the dashboard.
- Mobile-native app (responsive web only).

---

## 3. Data Sources

Three systems are involved. **Supabase is the canonical structured source; Azure holds the visual/face analysis; Neon stores the engine output.**

### 3.1 Supabase (primary — canonical, structured)
Project `qtewfburtvzsnigibrjt`. Read with the **secret** key (RLS bypass).

| Table | Rows | Used for |
|---|---|---|
| `users` | 2,254 | Canonical identity. `id` (UUID), `full_name`, `age`, `gender`, `readable_username`, `linkedin_url`, `stage`, `trust_status`, `pseudonym`. |
| `user_basics` | 2,179 | Structured attributes: `age`, `gender`, `height_cm`, `location_city`, `orientation`, `dating_preference`, `dating_mode`, `relationship_status` (+ `*_source`, `*_last_confirmed_at`). `visual_score` column exists but is **empty** → face score comes from Azure. |
| `user_persona` | 767 | Compatibility persona: `values`, `dealbreakers` (+structured/text), `attachment_style`, `intent_alignment`, `life_stage`, `identity_anchors`, `partner_text`, `self_text`, `relationship_text`, `visual_preference`, `weights` + embeddings. **Core input for scoring + LLM.** |
| `user_identities` | 2,254 | Channel mapping (`external_id`, `channel`, `readable_username`) — bridges to Instagram IDs. |
| `matches` | 360 | Previously presented matches: `is_mutual`, `confidence`, `match_reasoning`, `response`, `feedback`. Used for **exclusions** + evaluation. |
| `match_candidates` | 2 | Intended output schema (`rank`, `score`, `model_version`, `status`) — currently unused; our Neon output mirrors this shape. |
| `photo_links` | 146 | Photo-sharing tokens (reference only). |
| `messages` | 58,525 | Conversation history (optional signal / context). |

### 3.2 Azure Table Storage (visual/face analysis + legacy)
Account `wingy` (`https://wingy.table.core.windows.net`), Azure AD service principal.

| Table | Rows | Used for |
|---|---|---|
| `uservisualprofile` | 1,075 (≈639 distinct users) | **Face/visual score.** `analysis_json`: `scores.composite` (0–10), `calibrated_scores`, `archetype`, `masculine_feminine_signal`, energy/dominance/polarity profiles. **Eligibility gate + attraction factor.** |
| `usermedia` / `imagemetadata` | 4,367 / 234 | Photo blob paths & metadata (for dashboard thumbnails). |
| `userprofile` | 5,015 | Legacy free-text persona (messy) — fallback context only. |
| `compatibility`, `usersmatchmaker`, `matches` | 128K / 60 / 346 | **Legacy precomputed scores — explicitly NOT used for scoring** (per decision). May be referenced for backtesting only. |

### 3.3 The cross-system join (verified)
`supabase.users.id` (UUID) **==** `azure.uservisualprofile.PartitionKey` (UUID) **==** `supabase.user_persona.user_id`.
Confirmed: ~214 of the first 1,000 Supabase users have an Azure visual profile; **199** also have a persona → eligible.

### 3.4 Neon Postgres (output store)
Connection (verified, Postgres 18.4):
`postgresql://neondb_owner:***@ep-small-union-adz1o3ff-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
(REST/PostgREST also available at `https://ep-small-union-adz1o3ff.apirest.c-2.us-east-1.aws.neon.tech/neondb/rest/v1`.)
We **create the schema here and source everything from Azure + Supabase into it** — Neon becomes the single store the dashboard reads. The pipeline writes a self-contained snapshot per run so the dashboard never queries Azure/Supabase at view time.

---

## 4. Eligibility Gates (run before any scoring)

A user enters the **matchable pool** only if **all** hold:

1. **Has a face/visual score** — an Azure `uservisualprofile` row with a parseable `scores.composite`. *No face → removed.*
2. **Has persona data** — a Supabase `user_persona` row (non-empty `values`/`partner_text`/`self_text`). *No data → removed.*
3. **Has gender** — resolvable to `man` / `woman` (from `user_basics.gender` → `users.gender` → visual `masculine_feminine_signal` fallback). *Unresolvable → removed.*
4. **Has age** — a parseable integer age (normalize `"26"`, `"Twenty-six."`, `[]`, JSON forms via a small normalizer). *No age → removed (age is a hard factor).*
5. **Active / datable** — not blocked/withdrawn (`users.trust_status`, `stage`, `relationship_status` not "in a relationship"). 

> **Attractiveness percentile ("pct") gate — HARD DROP:** Compute each user's **visual percentile within their own gender**. **Hard-drop everyone below the floor** (default: below the **40th gender percentile**) — they leave the pool entirely and are never matched. *Within the survivors*, the dashboard still exposes the percentile as an adjustable filter (e.g. tighten to top 25% for a view) without changing who was dropped. The drop floor is a single config constant.

**Outcome-based prune (applied AFTER scoring + matching):** A user stays in the final pool **only if they have at least one decent mutual match they'd genuinely want to date** — i.e. ≥1 qualified mutual pair clearing the quality bar (Section 5.6). Users who pass the data gates but end up with **no good match are removed from the matching pool** (kept only in the "Excluded" view with reason `no_qualifying_match`). This is iterated to a fixed point: removing a low-quality user can drop a partner's only match, so the prune repeats until stable.

Pool reality (from sampling): **~350–450 data-eligible users**, gender skew **≈3:1 male:female**. After the outcome prune the *matched* pool will be smaller (women are scarce; men without a mutual match are dropped). The engine optimizes globally, not greedily per-man.

---

## 5. Matchmaking Logic (the core)

### 5.1 Candidate generation (orientation-driven, NOT hetero-only)
Pairing is **fully driven by each user's own data** — never assume heterosexual. For each subject `S`, candidate `C` is eligible iff:
- **Mutual orientation fit:** `C`'s gender satisfies `S`'s `orientation` + `dating_preference`, **and** `S`'s gender satisfies `C`'s. Same-sex, hetero, and any orientation present in the data are all supported. If orientation is missing, infer conservatively from `dating_preference`/persona; if still unresolvable, treat as a soft signal the LLM resolves rather than a hard hetero default.
- Age-gap rule passes (5.3) — applied by the **man↔woman** roles when the pair is mixed-gender; for same-gender pairs use a symmetric age-proximity band (default `|Δ| ≤ 4`, configurable).
- Not previously rejected together (`supabase.matches` with negative `response`/`feedback`).
- `C ≠ S`.

### 5.2 Directional factor scoring (subject-relative, gender-asymmetric)
Scoring is **directional**: `score(S→C)` = how good `C` is *for* `S`. Each direction is scored independently, then combined for mutuality (5.5).

Four factors, each normalized 0–1:

| Factor | Signal | Notes |
|---|---|---|
| **Attraction** | `S`'s `visual_preference` vs `C`'s visual profile (`composite`, `archetype`, `masculine_feminine_signal`, energy/polarity). Plus visual-percentile proximity. | Primary driver. |
| **Background** | Location proximity, life-stage alignment, values/identity-anchor overlap, education/`linkedin`, lifestyle. | From persona + basics. |
| **Career** | The **actual professions** of both people — `C`'s and `S`'s career/role/ambition (LinkedIn, persona `life_stage`, `career_stage`, profession text). | **Judged by the LLM, not a fixed number — see below.** |
| **Age** | Age proximity within the allowed band (5.3); closeness scored, out-of-band excluded. | Hard gate + soft score. |

**Career = LLM-judged on real professions, with reasoning (not a static weight).**
Instead of a fixed numeric career weight, the engine passes **both people's professions/careers** to the LLM and asks it to **judge career compatibility properly and explain why**, applying the asymmetry as a *principle*:
- When the **woman is the subject**, career/ambition/profession of the man is treated as **important** — a weak or mismatched career profile materially lowers the score.
- When the **man is the subject**, the woman's career is treated as **far less important** — it should rarely make or break the match.
- For same-gender pairs, the LLM weighs career by what each person's own persona/dealbreakers actually signal.
- The LLM returns a `career` sub-score **and** a `career_reasoning` string (e.g. "she's a doctor, he's an early-stage founder — strong ambition match; both high-drive professions") shown in the dashboard.

The non-career factors still combine numerically; career enters via the LLM:

| Subject `S` (mixed-gender) | Attraction | Background | Age | Career |
|---|---|---|---|---|
| **Woman → Man** | 0.35 | 0.30 | 0.20 | via LLM, **high influence** (can pull final score down/up strongly) |
| **Man → Woman** | 0.45 | 0.30 | 0.25 | via LLM, **low influence** (minor adjustment only) |

`raw_score(S→C) = Σ (weight_factor × factor_value)` over attraction/background/age → 0–1, then blended with the LLM pass (5.5) which contributes the LLM-judged career assessment and its reasoning.

### 5.3 Age-gap rules (hard, directional by gender)
Per the requirement ("man not much younger; man not older"). Let `Δ = man_age − woman_age`.

- **Hard floor (woman not much older):** `Δ ≥ −2` — the woman may be at most **2 years older** than the man (equivalently, the man is at most 2 years younger).
- **Upper bound (man may be older):** the **man can be older** than the woman, up to a configurable cap (default `Δ ≤ +7`); beyond the cap the pair is excluded, and within it larger gaps are penalized.
- Within band, the age factor scores higher the closer the ages.
- Pairs outside the band are **removed before** LLM/mutual stages.
- For same-gender pairs, use a symmetric band (default `|Δ| ≤ 4`).

> Encodes: "men can be slightly older than women; women can be only 2 years older than the man." Caps are config constants (`MAX_WOMAN_OLDER = 2`, `MAX_MAN_OLDER = 7`).

### 5.4 Compatibility threshold (custom, percentile-based)
Because we build our **own** 0–1 score:
- Keep `S→C` only if `raw_score` is in **`S`'s top percentile** of candidates (default: top 15%) **and** above an absolute floor (default `0.55`).
- This adapts to each person's option set while guaranteeing baseline quality.
- Thresholds are config constants.

### 5.5 LLM reasoning filter (Claude)
Every surviving directional candidate pair (after gates, age band, threshold) is sent to **Claude (Opus 4.x / Sonnet 4.x)** which both **filters** and **explains**.

**Input:** structured profiles of both people (persona, basics, visual summary, career), the subject direction, and the four-factor weights for that direction.

**Output (strict JSON):**
```json
{
  "verdict": "strong | possible | reject",
  "factor_scores": { "attraction": 0-1, "background": 0-1, "career": 0-1, "age": 0-1 },
  "career_reasoning": "why the two professions do/don't fit, given who is the subject",
  "llm_score": 0-1,
  "dealbreaker_violated": true|false,
  "red_flags": ["..."],
  "rationale": "2-4 sentence human-readable explanation",
  "one_line_hook": "short presentation line"
}
```
- The LLM is given **both people's professions** and judges `career` + writes `career_reasoning` (Section 5.2).
- `verdict: "reject"` or `dealbreaker_violated: true` → pair dropped.
- Final directional score `final(S→C) = α·raw_score + (1−α)·llm_score` (default `α = 0.5`), where `llm_score` incorporates the LLM-judged career assessment with the correct gender asymmetry.
- The LLM enforces the gender-asymmetric career logic and age logic *in the prompt* as guardrails.
- Caching: prompt-cache shared profile blocks; pairs deduped; only above-threshold pairs are sent (cost control).

### 5.6 Mutual best-match constraint (the decisive rule)
This implements your example: *A→B = 0.9 but B→A = 0.4 while B→C = 0.9 and C→B = 0.8 → match **B–C**, not A–B.*

Algorithm (mutual, up to **5 matches per person**):
1. Build directional preference lists: each `S` ranks surviving candidates by `final(S→C)` (desc).
2. A pair `(X, Y)` is a **qualified mutual pair** only if **both** directions clear the quality bar — i.e. `final(X→Y)` and `final(Y→X)` are each above the absolute floor **and** the LLM verdict is `strong`/`possible` in both directions (no dealbreaker either way). A high one-sided score (A→B) **never** qualifies if the other side (B→A) doesn't clear the bar.
3. Each person keeps their **top 5** qualified mutual pairs by combined score (`a_to_b + b_to_a`). A pair is **confirmed** if it sits in *either* person's top-5 — but mark it specially when it's in **both** top-5s ("strong mutual"). Cap per person enforced via a greedy highest-score-first assignment so the 5 slots go to the best mutual pairs.
4. Mark `is_mutual = true` for every confirmed pair; rank 1–5 per person.

**Result:** each retained person has **up to 5 mutual, high-quality, gate-clean, age-valid, LLM-approved** matches — people they'd genuinely want to date.

---

## 6. Pipeline Architecture (run once)

```
[Extract]  Supabase (users, user_basics, user_persona, identities, matches)
           + Azure (uservisualprofile, usermedia)
              │
              ▼
[Normalize] resolve UUIDs, parse gender/age, parse visual JSON, compute visual percentile
              │
              ▼
[Gate]     drop users failing eligibility (Section 4)
              │
              ▼
[Generate] orientation/gender/age-valid candidate pairs (directional)
              │
              ▼
[Score]    custom 4-factor weighted raw_score → percentile/threshold filter
              │
              ▼
[LLM]      Claude reasoning filter → verdict + factor scores + rationale
              │
              ▼
[Match]    qualified mutual pairs → top-5 per person (ranked)
              │
              ▼
[Prune]    drop users with no qualifying mutual match (iterate to fixed point)
              │
              ▼
[Store]    write users snapshot, directional pairs, confirmed matches, run metadata → Neon
```

- Implemented as a standalone **TypeScript (Node) script** (or Python) invoked once; idempotent per `run_id`.
- Re-runnable to produce a new versioned run without touching prior runs.

---

## 7. Output Data Model (Neon Postgres)

```
mm_run        (run_id PK, started_at, finished_at, model_version, config_json, pool_size, n_matches)

mm_user       (user_id PK, run_id, full_name, pseudonym, readable_username, gender, age,
               location_city, height_cm, orientation, dating_preference, career_stage, linkedin_url,
               visual_composite, visual_percentile, archetype, photo_paths_json,
               persona_summary, values_json, dealbreakers_json, eligible bool, ineligible_reason)

mm_pair       (id PK, run_id, subject_id, candidate_id, direction,
               raw_score, attraction, background, career, age_score,
               llm_score, final_score, verdict, dealbreaker_violated,
               red_flags_json, rationale, one_line_hook, rank)

mm_match      (id PK, run_id, user_a, user_b, is_mutual bool, strong_mutual bool,
               rank_for_a int, rank_for_b int,   -- 1..5 within each person's top-5
               combined_score, a_to_b_score, b_to_a_score,
               summary_reasoning, career_reasoning, status, created_at)
```

The dashboard reads `mm_match` (+ joins to `mm_user`, `mm_pair`) for the latest `run_id`.

---

## 8. Dashboard (Web App)

### 8.1 Views
1. **Matches** (default) — ranked list/grid of confirmed mutual matches: both photos, names, combined score, factor breakdown, one-line hook, status.
2. **Match detail** — side-by-side profiles, four-factor radar, directional scores (A→B / B→A), full LLM rationale, red flags, dealbreaker check, photos, shared values.
3. **People / Pool** — every eligible user with visual percentile, persona summary, their top-K mutual candidates.
4. **Excluded** — users removed by gates, with reason (no face, no persona, no age, etc.).
5. **Run overview** — pool size, gender split, match count, score distributions, model version.

### 8.2 Filters & search (required)
- **Best matches** (sort by combined score; "top matches only" toggle / score floor).
- **Search by name / username / pseudonym.**
- **Gender** (man / woman) and **direction**.
- **Compatibility score** range slider.
- **Attractiveness percentile** floor.
- **Per-factor** sliders (attraction / background / career / age).
- **Age** and **age-gap** range.
- **Location / city.**
- **Status** (confirmed mutual, candidate-only, presented, rejected) and **LLM verdict**.
- **Mutual-only** toggle (on by default).
- Combine filters; URL-persisted; CSV export.

### 8.3 Design
Premium, high-end aesthetic (apply the `high-end-visual-design` / `design-taste-frontend` standards): clean typographic hierarchy, calibrated spacing, subtle motion, data-dense but elegant. Dark + light. Responsive.

---

## 9. Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript, Tailwind, shadcn/ui, Recharts (radar/score charts). Deploy on Vercel.
- **Pipeline:** Node/TypeScript script; Anthropic SDK (`claude-opus-4-x` for reasoning, `claude-sonnet-4-x` for cost-sensitive bulk). Reads Supabase (`@supabase/supabase-js` w/ secret key) + Azure (`@azure/data-tables` w/ service principal). Writes Neon.
- **Output DB:** Neon Postgres (via REST Data API or direct connection).
- **Secrets:** `.env.local` (Supabase secret, Azure SP, Anthropic key, Neon key) — never committed.

---

## 10. Privacy & Security
- Real PII (names, photos, LinkedIn, phone). Dashboard must be **access-controlled** (auth gate before launch).
- Secrets in env only; service/secret keys never shipped to the browser — pipeline runs server-side/offline.
- Support pseudonym display mode for screen-sharing/demos.

---

## 11. Resolved Decisions & Remaining Questions

**Resolved (locked for v1):**
- **Matches per person:** up to **5** mutual matches per person, ranked. ✅
- **Outcome prune:** users with **no decent mutual match** are removed from the matching pool. ✅
- **Age:** men may be **slightly older** (default cap `Δ ≤ +7`); women at most **2 years older** than the man (`Δ ≥ −2`). ✅
- **Attractiveness floor:** HARD-drop below the gender percentile floor (default 40th); filter further within survivors in the UI. ✅
- **Career:** LLM judges the two real professions and explains it (gender-asymmetric as a principle); no fixed career weight. ✅
- **Orientation:** Fully data-driven from `orientation`/`dating_preference` — **not** hetero-only. ✅
- **Output store:** Neon (connection verified); pipeline sources everything from Azure + Supabase into Neon. ✅

**Minor knobs (defaults applied; tell me to change any):**
1. **Quality bar** for "decent match" — absolute final-score floor (default `0.55`) + LLM verdict `strong`/`possible`.
2. **Man-older cap** — keep `Δ ≤ +7`, or tighter/looser?
3. **Attractiveness floor value** — keep 40th gender percentile?
4. **Scope of run** — all eligible users, or a subset (e.g. a given `stage`)?

---

## 12. Milestones

1. **M1 — Engine core:** extract + normalize + gates + cross-DB join; produce eligible pool snapshot. *(Validate counts.)*
2. **M2 — Scoring + threshold:** directional 4-factor scoring, age band, percentile/threshold.
3. **M3 — LLM filter:** Claude reasoning pass with structured output + caching.
4. **M4 — Mutual matching:** stable mutual best-match; write full results to Neon.
5. **M5 — Dashboard:** views + filters + match detail + reasoning, on Neon data.
6. **M6 — Polish:** premium design pass, auth gate, exports, run overview.
