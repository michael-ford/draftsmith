/**
 * deliverable-generate — stage 3 of 3 (gather → extract → generate)
 * ───────────────────────────────────────────────────────────────
 * The "spec the shape" seam. Reads the (human-reviewed) brief.md + findings.md,
 * builds an outline via a judge panel, drafts each section, and runs an
 * adversarial critic loop until the draft passes — then writes the deliverable.
 *
 * Optional outline gate: pass stopAfterOutline:true to stop after writing
 * outline.md so you can approve/edit it; then re-run without the flag to draft
 * from the (possibly edited) outline.
 *
 * Reads:   <workDir>/deliverable-workspace/brief.md, findings.md
 *          <workDir>/deliverable-workspace/outline.md  (on the draft pass, if present)
 * Writes:  <workDir>/deliverable-workspace/outline.md  (always)
 *          <outputPath>                                 (the finished deliverable)
 *
 * Run (outline first, recommended):
 *   Workflow({ name: 'deliverable-generate', args: { workDir: '.', stopAfterOutline: true }})
 *   ...review/edit outline.md...
 *   Workflow({ name: 'deliverable-generate', args: { workDir: '.', outputPath: './deliverable.md' }})
 */

export const meta = {
  name: 'deliverable-generate',
  description: 'Stage 3/3: judge-panel outline → draft → adversarial critic loop → finished deliverable',
  phases: [
    { title: 'Outline',  detail: 'competing outlines, a judge picks and merges the best' },
    { title: 'Draft',    detail: 'write each section from its evidence, in parallel' },
    { title: 'Critique', detail: 'adversarial critics review → revise until it passes' },
    { title: 'Assemble', detail: 'write the finished deliverable to disk' },
  ],
}

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const cfg = {
  workDir:    A.workDir    || '.',
  outputPath: A.outputPath || './deliverable.md',
  format:     (A.format || 'md').toLowerCase(),   // md | docx | pptx
  stopAfterOutline:  A.stopAfterOutline || false,
  maxCritiqueRounds: A.maxCritiqueRounds || 3,
}
const dir = `${cfg.workDir}/deliverable-workspace`

// strip stray tag-like fragments a model may leak into a string field
const clean = (s) => String(s || '').replace(/<\/?[a-zA-Z_][^>]*>/g, '').trim()

const CONTEXT_SCHEMA = {
  type: 'object',
  required: ['brief', 'deliverable', 'audience', 'evidence'],
  properties: {
    brief:       { type: 'string', description: 'objective from brief.md' },
    deliverable: { type: 'string' },
    audience:    { type: 'string' },
    evidence:    { type: 'string', description: 'the full findings.md content, including any human bold-note flags' },
  },
}

const OUTLINE_SCHEMA = {
  type: 'object',
  required: ['title', 'thesis', 'sections'],
  properties: {
    title:  { type: 'string' },
    thesis: { type: 'string', description: 'the single controlling idea / recommendation' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['heading', 'purpose'],
        properties: {
          heading:      { type: 'string' },
          purpose:      { type: 'string' },
          evidenceRefs: { type: 'array', items: { type: 'string' } },
          wordTarget:   { type: 'integer' },
        },
      },
    },
  },
}

const JUDGE_SCHEMA = {
  type: 'object',
  required: ['winnerIndex', 'rationale', 'mergedOutline'],
  properties: {
    winnerIndex:   { type: 'integer' },
    rationale:     { type: 'string' },
    mergedOutline: OUTLINE_SCHEMA,
  },
}

const CRITIQUE_SCHEMA = {
  type: 'object',
  required: ['verdict', 'mustFix'],
  properties: {
    verdict: { type: 'string', enum: ['pass', 'revise'] },
    mustFix: {
      type: 'array',
      items: {
        type: 'object',
        required: ['issue', 'severity'],
        properties: {
          section:  { type: 'string' },
          issue:    { type: 'string' },
          severity: { type: 'string', enum: ['major', 'minor'] },
        },
      },
    },
    suggestions: { type: 'array', items: { type: 'string' } },
  },
}

// ── load reviewed context ────────────────────────────────
const ctx = await agent(
  `Read "${dir}/brief.md" and "${dir}/findings.md". Return the objective, deliverable type, audience, ` +
  `and the FULL findings content verbatim as "evidence" (preserve any **bold notes** the human added — ` +
  `those flag must-haves). If either file is missing, say so.`,
  { schema: CONTEXT_SCHEMA, label: 'load-context', phase: 'Outline' }
)

// ── 1. Outline (judge panel) ─────────────────────────────
phase('Outline')
const ANGLES = [
  'Lead with the strongest evidence and build the case up from it.',
  'Lead with the decision the audience must make and work backward to the evidence.',
  'Lead with a problem→solution narrative arc that carries the reader.',
]
const outlines = (await parallel(ANGLES.map((angle, i) => () =>
  agent(
    `Propose an outline for a ${ctx.deliverable} aimed at: ${ctx.audience}.\n` +
    `Brief: ${ctx.brief}\n\nStructural angle: ${angle}\n\nEvidence:\n${ctx.evidence}`,
    { schema: OUTLINE_SCHEMA, phase: 'Outline', label: `outline:${i + 1}` }
  )
))).filter(Boolean)

const judged = await agent(
  `You are an editor. Pick the strongest of these ${outlines.length} outlines for a ${ctx.deliverable} ` +
  `(audience: ${ctx.audience}; brief: ${ctx.brief}) and merge in the best ideas from the others. ` +
  `Honor any must-haves the human flagged in the evidence.\n\n${JSON.stringify(outlines, null, 2)}`,
  { schema: JUDGE_SCHEMA, phase: 'Outline', label: 'judge' }
)
const judgedOutline = judged.mergedOutline

// write outline.md (always) so it's reviewable / editable
const outlineDoc =
  `# Outline — ${clean(judgedOutline.title)}\n\n**Thesis:** ${clean(judgedOutline.thesis)}\n\n` +
  judgedOutline.sections.map((s, i) =>
    `## ${i + 1}. ${clean(s.heading)}\n- **Purpose:** ${clean(s.purpose)}\n` +
    (s.evidenceRefs && s.evidenceRefs.length ? `- **Leans on:** ${s.evidenceRefs.map(clean).join(', ')}\n` : '') +
    (s.wordTarget ? `- **~${s.wordTarget} words**\n` : '')
  ).join('\n') +
  `\n*Edit this outline (reorder, retitle, rewrite the thesis, cut sections), then re-run ` +
  `/deliverable-generate without stopAfterOutline to draft from it.*\n`

await agent(
  `Write this file verbatim with the Write tool to "${dir}/outline.md":\n\n<<<\n${outlineDoc}\n>>>\n\nConfirm.`,
  { phase: 'Outline', label: 'write-outline' }
)
log(`Outline "${judgedOutline.title}" — ${judgedOutline.sections.length} sections (winner #${judged.winnerIndex + 1})`)

// ── optional human gate: stop here for outline approval ──
if (cfg.stopAfterOutline) {
  return {
    stage: 'generate (outline only)',
    wrote: [`${dir}/outline.md`],
    sections: judgedOutline.sections.length,
    next: 'Review/edit outline.md, then re-run /deliverable-generate (without stopAfterOutline) to draft it.',
  }
}

// on the draft pass, prefer the human-edited outline.md over the in-memory one
const outline = (await agent(
  `Read "${dir}/outline.md" and return its structure. The human may have edited it — use what's on disk.`,
  { schema: OUTLINE_SCHEMA, label: 'reload-outline', phase: 'Draft' }
)) || judgedOutline

// ── 2. Draft (pipeline: each section independent) ────────
phase('Draft')
const sectionDrafts = (await pipeline(
  outline.sections,
  (sec) => agent(
    `Draft the section "${sec.heading}" of a ${ctx.deliverable} for ${ctx.audience}.\n` +
    `Purpose: ${sec.purpose}\nOverall thesis: ${outline.thesis}\n` +
    `Target ~${sec.wordTarget || 250} words. Ground every claim in this evidence (cite inline where useful):\n` +
    `${ctx.evidence}\n\nReturn polished markdown for THIS section only, starting with "## ${sec.heading}". No preamble.`,
    { phase: 'Draft', label: `draft:${sec.heading}` }
  )
)).filter(Boolean)
let draft = `# ${outline.title}\n\n*${outline.thesis}*\n\n${sectionDrafts.join('\n\n')}`

// ── 3. Critique → revise (convergence loop) ──────────────
phase('Critique')
const DIMENSIONS = [
  'factual accuracy and whether every claim is supported by the evidence',
  'clarity and readability for the target audience',
  'structure, flow, and whether the thesis is delivered',
  'persuasiveness and whether the deliverable achieves the brief',
  'gaps, hand-waving, and unsupported assertions',
]
let round = 0
while (round < cfg.maxCritiqueRounds) {
  round++
  const critiques = (await parallel(DIMENSIONS.map(d => () =>
    agent(
      `Adversarially critique the draft below on ONE axis: ${d}.\nBe a skeptic — surface real problems. ` +
      `Brief: ${ctx.brief}\n\n--- DRAFT ---\n${draft}`,
      { schema: CRITIQUE_SCHEMA, phase: 'Critique', label: `critique:r${round}` }
    )
  ))).filter(Boolean)
  const major = critiques.flatMap(c => c.mustFix).filter(m => m.severity === 'major')
  if (!major.length || critiques.every(c => c.verdict === 'pass')) {
    log(`Converged after ${round} critique round(s)`); break
  }
  log(`Round ${round}: ${major.length} major issue(s) → revising`)
  const suggestions = critiques.flatMap(c => c.suggestions || [])
  draft = await agent(
    `Revise the ${ctx.deliverable} to fix these issues WITHOUT losing strengths or padding it.\n` +
    `Major issues:\n${JSON.stringify(major, null, 2)}\nSuggestions:\n${JSON.stringify(suggestions, null, 2)}\n\n` +
    `Return the complete revised markdown.\n\n--- CURRENT DRAFT ---\n${draft}`,
    { phase: 'Critique', label: `revise:r${round}` }
  )
}

// ── 4. Assemble (copyedit, write markdown, optional format export) ──
phase('Assemble')
const base = cfg.outputPath.replace(/\.(md|markdown|docx|pptx)$/i, '')
const mdPath = `${base}.md`

const summary = await agent(
  `Do a final light copyedit on the ${ctx.deliverable} below, then write it as Markdown with the Write tool to ` +
  `"${mdPath}" (create parent dirs if needed). Return a one-paragraph summary plus final word count.\n\n` +
  `--- DELIVERABLE ---\n${draft}`,
  { phase: 'Assemble', label: 'write-md' }
)

let exportedPath = mdPath
if (cfg.format === 'docx') {
  exportedPath = `${base}.docx`
  await agent(
    `Render the Markdown file "${mdPath}" to a Word document at "${exportedPath}".\n` +
    `Preferred: \`pandoc "${mdPath}" -o "${exportedPath}" --from gfm\` (preserves headings, bold/italic, tables, blockquotes).\n` +
    `If pandoc is missing, fall back to python-docx via \`uv run --with python-docx\`, or \`soffice --headless --convert-to docx\`.\n` +
    `If none are available, leave the .md as the deliverable and report that docx export was unavailable. ` +
    `Confirm the file exists and report the method used.`,
    { phase: 'Assemble', label: 'render-docx' }
  )
} else if (cfg.format === 'pptx') {
  exportedPath = `${base}.pptx`
  await agent(
    `Turn this ${ctx.deliverable} into a slide deck at "${exportedPath}". This is TWO jobs:\n` +
    `STEP 1 — AUTHOR THE SLIDES (the important part, not a render): restructure the prose into ~6–10 slides. ` +
    `Each slide = a short title + at most 6 terse bullets. Compress paragraphs, demote caveats to sub-bullets, ` +
    `turn any table into bullet lines, drop detail that won't fit. This is a writing task — do it well.\n` +
    `STEP 2 — RENDER: generate the .pptx with python-pptx via \`uv run --with python-pptx python <script>\`.\n` +
    `If uv/python-pptx are unavailable, write the slide outline as Markdown next to the deliverable and report ` +
    `that pptx export was unavailable. Confirm the file exists and report slide count + method.\n\n` +
    `--- SOURCE DELIVERABLE ---\n${draft}`,
    { phase: 'Assemble', label: 'render-pptx' }
  )
}

return {
  stage: 'generate',
  outputPath: exportedPath,
  markdownPath: mdPath,
  format: cfg.format,
  sections: outline.sections.length,
  critiqueRounds: round,
  summary,
  next: 'Review the deliverable. To revise, edit findings.md/outline.md or note changes and re-run /deliverable-generate.',
}
