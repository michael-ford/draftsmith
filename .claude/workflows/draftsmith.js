/**
 * draftsmith — a Claude Code dynamic workflow
 * ────────────────────────────────────────────────────────
 * Researches a brief across the channels you choose (the web, a local folder,
 * named MCP integrations), then turns the material into a polished,
 * self-critiqued written deliverable (report, proposal, brief, or memo).
 *
 * It uses the four signature moves of dynamic workflows on KNOWLEDGE WORK
 * instead of code:
 *   • fan-out      — research every channel, then extract every source, in parallel
 *   • pipeline     — each source / section flows independently, no barriers
 *   • judge panel  — competing outlines, one judge picks + merges the best
 *   • convergence  — adversarial critics review the draft and it revises
 *                    itself until they pass (or max rounds)
 *
 * This is the autonomous one-shot. For human review between stages, use the
 * staged trio instead: deliverable-gather → deliverable-extract → deliverable-generate.
 *
 * ── Install ──────────────────────────────────────────────
 *   Drop this file in your project at:  .claude/workflows/draftsmith.js
 *   Then run it from Claude Code with the Workflow tool, e.g.:
 *
 *     Workflow({ name: 'draftsmith', args: {
 *       brief:       'Make the case for funding project X to the city council.',
 *       deliverable: 'proposal',                       // report | proposal | brief | memo
 *       audience:    'municipal decision-makers, non-technical',
 *       sources:     'web; my Drive "Project X" folder',  // channels to gather from (optional)
 *       sourcesDir:  './notes',                         // optional local folder to also read
 *       outputPath:  './out/proposal.docx',
 *       format:      'docx'                              // md (default) | docx | pptx
 *     }})
 *
 * Because a workflow can't ask mid-run, decide the `sources` channels in chat first.
 * Every field has a sensible default, so `args` is optional.
 * Output is always written as Markdown; format:'docx' also renders via pandoc, and
 * format:'pptx' re-authors the prose into slides and renders via python-pptx
 * (each falls back to Markdown if the tool isn't installed).
 */

export const meta = {
  name: 'draftsmith',
  description: 'Research a brief across channels and turn it into a polished, self-critiqued deliverable',
  phases: [
    { title: 'Gather',     detail: 'plan research, gather from each channel in parallel (web / folder / integrations)' },
    { title: 'Extract',    detail: 'pull structured findings from each source in parallel' },
    { title: 'Synthesize', detail: 'competing outlines, a judge picks and merges the best' },
    { title: 'Draft',      detail: 'write each section from its evidence, in parallel' },
    { title: 'Critique',   detail: 'adversarial critics review → revise until it passes' },
    { title: 'Assemble',   detail: 'write the final deliverable to disk' },
  ],
}

// ── config (all overridable via args) ────────────────────
// args may arrive as an object or as a JSON-encoded string — handle both.
const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const cfg = {
  brief:       A.brief       || 'Synthesize the material into a clear, evidence-backed deliverable.',
  deliverable: A.deliverable || 'report',
  audience:    A.audience    || 'an informed but non-expert decision-maker',
  sources:     A.sources     || 'web',             // free-form channel spec; 'web' => web research only
  sourcesDir:  A.sourcesDir  || '',                // optional local folder; '' => none
  outputPath:  A.outputPath  || './deliverable.md',
  format:      (A.format || 'md').toLowerCase(),   // md | docx | pptx
  maxCritiqueRounds: A.maxCritiqueRounds || 3,
}
const outDir = cfg.outputPath.includes('/') ? cfg.outputPath.slice(0, cfg.outputPath.lastIndexOf('/')) : '.'
const gatheredDir = `${outDir}/gathered`
log(`Config: deliverable=${cfg.deliverable}, format=${cfg.format}, channels=${cfg.sources}, out=${cfg.outputPath}`)

// ── schemas ──────────────────────────────────────────────
const SURVEY_SCHEMA = {
  type: 'object',
  required: ['sources'],
  properties: {
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'kind', 'summary', 'relevance'],
        properties: {
          path:      { type: 'string', description: 'path to the source file' },
          kind:      { type: 'string', description: 'transcript | pdf | notes | spreadsheet | webclip | other' },
          summary:   { type: 'string', description: 'one-line description of what this source contains' },
          relevance: { type: 'string', enum: ['high', 'medium', 'low'], description: 'relevance to the brief' },
        },
      },
    },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['channel', 'task', 'label'],
        properties: {
          channel: { type: 'string', enum: ['web', 'integration'] },
          task:    { type: 'string', description: 'what to find, specifically' },
          label:   { type: 'string', description: 'short kebab-case id for the output filename' },
          tool:    { type: 'string', description: 'for integration tasks: which service/MCP (e.g. google-drive, gmail)' },
        },
      },
    },
  },
}

const GATHERED_SCHEMA = {
  type: 'object',
  required: ['path', 'summary', 'relevance'],
  properties: {
    path:      { type: 'string', description: 'file written under gathered/, or "none" if nothing found' },
    summary:   { type: 'string' },
    relevance: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
  },
}

const EXTRACTION_SCHEMA = {
  type: 'object',
  required: ['source', 'keyPoints'],
  properties: {
    source: { type: 'string' },
    keyPoints: {
      type: 'array',
      description: 'the load-bearing findings from this source',
      items: {
        type: 'object',
        required: ['claim', 'theme', 'confidence'],
        properties: {
          claim:         { type: 'string', description: 'a factual claim, finding, requirement, or data point' },
          evidenceQuote: { type: 'string', description: 'verbatim supporting quote or figure, if present' },
          theme:         { type: 'string', description: 'short theme tag to cluster on later' },
          confidence:    { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    gaps: { type: 'array', items: { type: 'string' }, description: 'open questions this source raises but does not answer' },
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
          heading:    { type: 'string' },
          purpose:    { type: 'string', description: 'what this section must accomplish for the reader' },
          evidenceRefs: { type: 'array', items: { type: 'string' }, description: 'themes/claims this section leans on' },
          wordTarget: { type: 'integer', description: 'rough word budget for this section' },
        },
      },
    },
  },
}

const JUDGE_SCHEMA = {
  type: 'object',
  required: ['winnerIndex', 'rationale', 'mergedOutline'],
  properties: {
    winnerIndex:   { type: 'integer', description: 'index of the strongest outline' },
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

// ── 1. Gather (plan research → fan out across channels → inventory) ──
phase('Gather')
const plan = await agent(
  `Plan the research for this deliverable.\n\nBRIEF (${cfg.deliverable} for ${cfg.audience}):\n${cfg.brief}\n\n` +
  `Channels to gather from: ${cfg.sources || '(none specified — default to web research)'}\n\n` +
  `Break this into 3–6 concrete parallel tasks. Use channel "web" for anything findable by searching/fetching ` +
  `the open web. Use channel "integration" for a named service (set "tool", e.g. google-drive, gmail, notion) ` +
  `only if the user named it. Give each a short kebab-case label.`,
  { schema: PLAN_SCHEMA, phase: 'Gather', label: 'plan-research' }
)
await agent(`Create the directory "${gatheredDir}" if it does not exist (Bash: mkdir -p). Confirm.`,
  { phase: 'Gather', label: 'prep-dir' })

const gathered = (await pipeline(
  plan.tasks,
  (t) => agent(
    (t.channel === 'web'
      ? `Research this on the open web with WebSearch and WebFetch. Pull real, citable facts and figures.\n\nTASK: ${t.task}\n`
      : `Gather this from the "${t.tool || 'named'}" integration. Use ToolSearch to find its MCP tools, then retrieve. If unavailable, return relevance "none".\n\nTASK: ${t.task}\n`) +
    `\nWrite clean Markdown notes (with links where relevant) to "${gatheredDir}/${t.label}.md" via the Write tool. ` +
    `Then report the path, a one-line summary, and how relevant it turned out.`,
    { schema: GATHERED_SCHEMA, phase: 'Gather', label: `gather:${t.label}` }
  )
)).filter(Boolean).filter(g => g.relevance !== 'none' && g.path && g.path !== 'none')

let folderSources = []
if (cfg.sourcesDir) {
  const inv = await agent(
    `List and skim every file in the folder "${cfg.sourcesDir}" (recurse). For each give a one-line summary and ` +
    `rate relevance to this brief:\n\n${cfg.brief}\n\nUse Glob/Read/Bash. Return them with their real paths.`,
    { schema: SURVEY_SCHEMA, phase: 'Gather', label: 'inventory-folder' }
  )
  folderSources = (inv.sources || []).filter(s => s.relevance !== 'low')
}

const sources = [
  ...gathered.map(g => ({ path: g.path, kind: 'research', summary: g.summary, relevance: g.relevance })),
  ...folderSources,
]
log(`Gathered ${gathered.length} researched + ${folderSources.length} folder → ${sources.length} sources`)
if (!sources.length) {
  log('Nothing gathered — check the brief, the channels, or whether WebSearch/MCP tools are available.')
  return { error: 'no material gathered', sources: cfg.sources, sourcesDir: cfg.sourcesDir }
}

// ── 2. Extract (pipeline: each source independent) ───────
phase('Extract')
const extractions = (await pipeline(
  sources,
  (src) => agent(
    `Read the source at "${src.path}" (${src.kind}). Pull only the load-bearing findings ` +
    `relevant to this brief:\n\n${cfg.brief}\n\n` +
    `Capture verbatim quotes/figures where they exist. Note open questions as gaps.`,
    { schema: EXTRACTION_SCHEMA, phase: 'Extract', label: `extract:${src.path.split('/').pop()}` }
  )
)).filter(Boolean)

// compact evidence digest the downstream stages can all reference
const evidence = extractions
  .map(e => `### ${e.source}\n` + e.keyPoints.map(k =>
    `- (${k.confidence}/${k.theme}) ${k.claim}${k.evidenceQuote ? `  «${k.evidenceQuote}»` : ''}`
  ).join('\n'))
  .join('\n\n')
log(`Extracted ${extractions.reduce((n, e) => n + e.keyPoints.length, 0)} findings across ${extractions.length} sources`)

// ── 3. Synthesize (judge panel over competing outlines) ──
phase('Synthesize')
const ANGLES = [
  'Lead with the strongest evidence and build the case up from it.',
  'Lead with the decision the audience must make and work backward to the evidence.',
  'Lead with a problem→solution narrative arc that carries the reader.',
]
const outlines = (await parallel(ANGLES.map((angle, i) => () =>
  agent(
    `Propose an outline for a ${cfg.deliverable} aimed at: ${cfg.audience}.\n` +
    `Brief: ${cfg.brief}\n\nStructural angle to take: ${angle}\n\nEvidence available:\n${evidence}`,
    { schema: OUTLINE_SCHEMA, phase: 'Synthesize', label: `outline:${i + 1}` }
  )
))).filter(Boolean)

const judged = await agent(
  `You are an editor. Below are ${outlines.length} candidate outlines for a ${cfg.deliverable} ` +
  `(audience: ${cfg.audience}; brief: ${cfg.brief}). Pick the strongest and merge in the best ideas ` +
  `from the others into one improved outline.\n\n${JSON.stringify(outlines, null, 2)}`,
  { schema: JUDGE_SCHEMA, phase: 'Synthesize', label: 'judge' }
)
const outline = judged.mergedOutline
log(`Outline: "${outline.title}" — ${outline.sections.length} sections (winner #${judged.winnerIndex + 1})`)

// ── 4. Draft (pipeline: each section independent) ────────
phase('Draft')
const sectionDrafts = (await pipeline(
  outline.sections,
  (sec) => agent(
    `Draft the section "${sec.heading}" of a ${cfg.deliverable} for ${cfg.audience}.\n` +
    `Purpose of this section: ${sec.purpose}\n` +
    `Overall thesis: ${outline.thesis}\n` +
    `Target length: ~${sec.wordTarget || 250} words.\n` +
    `Ground every claim in this evidence (cite sources inline where useful):\n${evidence}\n\n` +
    `Return polished markdown for THIS section only, starting with a "## ${sec.heading}" heading. No preamble.`,
    { phase: 'Draft', label: `draft:${sec.heading}` }
  )
)).filter(Boolean)

let draft = `# ${outline.title}\n\n*${outline.thesis}*\n\n${sectionDrafts.join('\n\n')}`

// ── 5. Critique → revise (convergence loop) ──────────────
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
  const critiques = (await parallel(DIMENSIONS.map(dim => () =>
    agent(
      `Adversarially critique the draft below on ONE axis: ${dim}.\n` +
      `Be a skeptic — surface real problems, don't rubber-stamp. Brief: ${cfg.brief}\n\n` +
      `--- DRAFT ---\n${draft}`,
      { schema: CRITIQUE_SCHEMA, phase: 'Critique', label: `critique:r${round}` }
    )
  ))).filter(Boolean)

  const majorIssues = critiques.flatMap(c => c.mustFix).filter(m => m.severity === 'major')
  if (!majorIssues.length || critiques.every(c => c.verdict === 'pass')) {
    log(`Converged after ${round} critique round(s) — no major issues remain`)
    break
  }
  log(`Round ${round}: ${majorIssues.length} major issue(s) → revising`)
  const suggestions = critiques.flatMap(c => c.suggestions || [])
  draft = await agent(
    `Revise the ${cfg.deliverable} below to fix these issues WITHOUT losing its strengths or padding it.\n` +
    `Major issues to fix:\n${JSON.stringify(majorIssues, null, 2)}\n` +
    `Helpful suggestions:\n${JSON.stringify(suggestions, null, 2)}\n\n` +
    `Return the complete revised markdown.\n\n--- CURRENT DRAFT ---\n${draft}`,
    { phase: 'Critique', label: `revise:r${round}` }
  )
}

// ── 6. Assemble (copyedit, write markdown, optional format export) ──
phase('Assemble')
const base = cfg.outputPath.replace(/\.(md|markdown|docx|pptx)$/i, '')
const mdPath = `${base}.md`

const summary = await agent(
  `Do a final light copyedit on the ${cfg.deliverable} below, then write it as Markdown with the Write tool ` +
  `to "${mdPath}" (create parent dirs if needed). Return a one-paragraph summary plus the final word count.\n\n` +
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
    `Turn this ${cfg.deliverable} into a slide deck at "${exportedPath}". This is TWO jobs:\n` +
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
  outputPath: exportedPath,
  markdownPath: mdPath,
  format: cfg.format,
  deliverable: cfg.deliverable,
  sourcesUsed: sources.length,
  findings: extractions.reduce((n, e) => n + e.keyPoints.length, 0),
  sections: outline.sections.length,
  critiqueRounds: round,
  summary,
}
