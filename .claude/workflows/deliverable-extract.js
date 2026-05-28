/**
 * deliverable-extract — stage 2 of 3 (gather → extract → generate)
 * ───────────────────────────────────────────────────────────────
 * The "spec the substance" seam. Reads the (human-reviewed) brief.md + sources.md
 * from stage 1, fans out one extractor per relevant source, and writes a
 * human-readable findings digest you edit before generation.
 *
 * Reads:   <workDir>/deliverable-workspace/brief.md, sources.md
 * Writes:  <workDir>/deliverable-workspace/findings.md   (edit this — cut noise, flag what matters)
 *
 * Run:  Workflow({ name: 'deliverable-extract', args: { workDir: '.' }})
 * Then read findings.md, trim/annotate, and run /deliverable-generate.
 */

export const meta = {
  name: 'deliverable-extract',
  description: 'Stage 2/3: fan-out extraction per source → an editable findings digest',
  phases: [
    { title: 'Read',    detail: 'load the reviewed brief + source list' },
    { title: 'Extract', detail: 'pull structured findings from each source in parallel' },
    { title: 'Digest',  detail: 'cluster by theme and write findings.md' },
  ],
}

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const cfg = { workDir: A.workDir || '.' }
const dir = `${cfg.workDir}/deliverable-workspace`

// strip stray tag-like fragments a model may leak into a string field
const clean = (s) => String(s || '').replace(/<\/?[a-zA-Z_][^>]*>/g, '').trim()

const PLAN_SCHEMA = {
  type: 'object',
  required: ['brief', 'deliverable', 'audience', 'sources'],
  properties: {
    brief:       { type: 'string', description: 'the objective text from brief.md' },
    deliverable: { type: 'string' },
    audience:    { type: 'string' },
    sources: {
      type: 'array',
      description: 'sources the human kept (relevance not low, not struck out)',
      items: {
        type: 'object',
        required: ['path'],
        properties: { path: { type: 'string' }, note: { type: 'string', description: 'any human annotation' } },
      },
    },
  },
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  required: ['source', 'keyPoints'],
  properties: {
    source: { type: 'string' },
    keyPoints: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'theme', 'confidence'],
        properties: {
          claim:         { type: 'string' },
          evidenceQuote: { type: 'string' },
          theme:         { type: 'string' },
          confidence:    { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    gaps: { type: 'array', items: { type: 'string' } },
  },
}

// ── 1. Read the reviewed plan ────────────────────────────
phase('Read')
const plan = await agent(
  `Read "${dir}/brief.md" and "${dir}/sources.md". Extract the objective, deliverable type, audience, ` +
  `and the list of sources to use. IMPORTANT: respect human edits — skip any source struck through, ` +
  `marked drop/skip, or rated low, and carry over any inline notes. If the files don't exist, say so.`,
  { schema: PLAN_SCHEMA, label: 'read-plan' }
)
if (!plan.sources || !plan.sources.length) {
  log('No usable sources in sources.md — run /deliverable-gather first, or un-cut some sources.')
  return { stage: 'extract', error: 'no sources after review' }
}
log(`${plan.sources.length} source(s) kept for extraction`)

// ── 2. Extract (pipeline: each source independent) ───────
phase('Extract')
const extractions = (await pipeline(
  plan.sources,
  (src) => agent(
    `Read "${src.path}" and pull only the load-bearing findings for this brief:\n\n${plan.brief}\n\n` +
    (src.note ? `Human note on this source: ${src.note}\n\n` : '') +
    `Capture verbatim quotes/figures where they exist. Note open questions as gaps.`,
    { schema: EXTRACTION_SCHEMA, phase: 'Extract', label: `extract:${src.path.split('/').pop()}` }
  )
)).filter(Boolean)
const totalFindings = extractions.reduce((n, e) => n + e.keyPoints.length, 0)
log(`Extracted ${totalFindings} findings across ${extractions.length} sources`)

// ── 3. Write the editable findings digest ────────────────
phase('Digest')
const bySource = extractions.map(e =>
  `### ${e.source}\n` +
  e.keyPoints.map(k =>
    `- **(${k.confidence} · ${clean(k.theme)})** ${clean(k.claim)}` + (k.evidenceQuote ? `\n  > ${clean(k.evidenceQuote)}` : '')
  ).join('\n') +
  (e.gaps && e.gaps.length ? `\n\n  _Gaps:_ ${e.gaps.map(clean).join('; ')}` : '')
).join('\n\n')

const findingsDoc =
  `# Findings\n\n` +
  `*Extracted from ${extractions.length} sources (${totalFindings} findings). ` +
  `Edit before generating: delete noise, fix anything wrong, add a **bold note** to flag what must land in the deliverable.*\n\n` +
  `${bySource}\n`

await agent(
  `Write this file with the Write tool, verbatim, to "${dir}/findings.md":\n\n<<<\n${findingsDoc}\n>>>\n\nConfirm it was written.`,
  { phase: 'Digest', label: 'write-findings' }
)

return {
  stage: 'extract',
  wrote: [`${dir}/findings.md`],
  sources: extractions.length,
  findings: totalFindings,
  next: 'Review findings.md (trim noise, flag must-haves), then run /deliverable-generate.',
}
