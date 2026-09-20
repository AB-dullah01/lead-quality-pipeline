# LeadTrust — Quality-first lead pipeline

Caprae Capital Full Stack handbook challenge: **Quality First** enhancement for the SaaSquatch-style leadgen workflow.

**Live demo:** https://lead-quality-pipeline.vercel.app/ 
**Repo:** https://github.com/AB-dullah01/lead-quality-pipeline

## Problem observed on SaaSquatch

1. **Estimate Revenue** failed with raw Gemini errors in the table (`All GeMini models failed…`).
2. **Get Owner Details** returned `Not Found` + literal **`NaN`** values.
3. **Enrich Company** reported “success” while employees / revenue / year founded stayed empty — **credits still burned**.

LeadTrust fixes the paid step: **prioritize with confidence → enrich selectively → charge only when fields actually fill**.

## Demo flow

1. `npm install && npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Pick an **industry**, **country** (USA / Canada / UK / France — same as SaaSquatch), and **city or state**, then **Find companies**
4. Click **Estimate & score**
5. Click **Select fit score ≥ 70** (or manually pick thin leads)
6. Click **Enrich selected**
7. Compare: rich leads succeed (−1 credit); thin leads show `empty · $0`
8. **Export CSV**

Demo catalogs are seeded per industry (10 companies each) with a mix of enrichable vs empty — same integrity rule across all buy boxes. City/state accepts free text (e.g. `NY`, `Texas`, `Toronto`, `London`) and stamps onto results.

## Stack

| Layer | Choice |
|---|---|
| UI | Next.js 15 + React 19 + Tailwind |
| API | Next.js Route Handlers (serverless on Vercel) |
| Scoring | Deterministic heuristics + confidence + in-memory TTL cache |
| Enrichment | Multi-source simulator (Apollo/Growjo/DB-shaped) with integrity rules |
| Database | **Cloud Firestore** (GCP) when env configured; otherwise **in-memory** |
| Hosting | **Vercel** Hobby (free) |

## Architecture

```text
Browser (LeadTrust UI)
  → POST /api/session   create discovery set + credits
  → POST /api/score     fit score + revenue band + confidence
  → POST /api/enrich    enrich selected; charge only on filled fields
  → GET  /api/export    CSV download
  → Firestore sessions/{id}  (when Firebase env is set)
     else in-memory Map
```

### Credit integrity rule

```text
if fieldsFilled.length === 0 → status=empty, charged=0, waived++
else → status=success, charged=1
```

Never display `NaN` or raw model failure strings.

---


## Why Quality First (not Quantity Driven)

SaaSquatch already has many modules. The gap is **trust in the paid pipeline**. One sharp vertical slice scores higher on Caprae’s Business / UX / Technicality rubric than several thin tools.


## Author

Built for Caprae Capital Partners Full Stack Developer AI Interview Handbook (Quality First).
