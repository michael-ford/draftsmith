/**
 * deliverable-gather — stage 1 of 3 (gather → extract → generate)
 * ───────────────────────────────────────────────────────────────
 * The "spec the inputs" seam. Inventories the source material, assesses how
 * well it covers the brief, and surfaces the gaps + open questions you should
 * resolve BEFORE extraction. Writes two editable artifacts and hands control
 * back to the conversation — a dynamic workflow can't take mid-run input, so
 * the human seam lives between stages, not inside them.
 *
 * Artifacts written to <workDir>/deliverable-workspace/:
 *   brief.md    — the spec (task, deliverable type, audience). Edit to refine scope.
 *   sources.md  — inventory + relevance + coverage gaps + questions for you.
 *
 * Run:  Workflow({ name: 'deliverable-gather', args: {
 *         workDir: '.', sourcesDir: './sources',
 *         deliverable: 'brief', audience: '...', brief: '...' }})
 * Then read sources.md, discuss/cut/confirm, and run /deliverable-extract.
 */

export const meta = {
  name: 'deliverable-gather',
  description: 'Stage 1/3: inventory sources, assess coverage vs the brief, surface gaps + spec questions',
  phases: [
    { title: 'Inventory', detail: 'survey every source file and rate relevance' },
    { title: 'Assess',    detail: 'check coverage against the brief, find gaps + questions' },
  ],
}

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const cfg = {
  workDir:     A.workDir     || '.',
  sourcesDir:  A.sourcesDir  || './sources',
  deliverable: A.deliverable || 'report',
  brief:       A.brief       || 'Synthesize the source material into a clear, evidence-backed deliverable.',
  audience:    A.audience    || 'an informed but non-expert decision-maker',
}
const dir = `${cfg.workDir}/deliverable-workspace`

// strip stray tag-like fragments a model may leak into a string field
const clean = (s) => String(s || '').replace(/<\/?[a-zA-Z_][^>]*>/g, '').trim()

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
          path:      { type: 'string' },
          kind:      { type: 'string', description: 'transcript | pdf | notes | spreadsheet | webclip | other' },
          summary:   { type: 'string' },
          relevance: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

const ASSESS_SCHEMA = {
  type: 'object',
  required: ['coverage', 'gaps', 'questions'],
  properties: {
    coverage:  { type: 'string', description: 'how well the sources answer the brief, overall' },
    gaps:      { type: 'array', items: { type: 'string' }, description: 'what the brief asks that the sources do NOT cover' },
    questions: { type: 'array', items: { type: 'string' }, description: 'spec questions for the human to resolve before extraction' },
    conflicts: { type: 'array', items: { type: 'string' }, description: 'sources that appear to disagree with each other' },
  },
}

// ── 1. Inventory ─────────────────────────────────────────
phase('Inventory')
const survey = await agent(
  `List and skim every file in "${cfg.sourcesDir}" (recurse). For each give a one-line summary and ` +
  `rate relevance to this brief:\n\n${cfg.brief}\n\nUse Glob/Read/Bash as needed.`,
  { schema: SURVEY_SCHEMA, label: 'inventory' }
)
log(`Inventoried ${survey.sources.length} files`)

// ── 2. Assess coverage ───────────────────────────────────
phase('Assess')
const inventoryText = survey.sources
  .map(s => `- [${s.relevance}] ${s.path} (${s.kind}) — ${clean(s.summary)}`).join('\n')
const assess = await agent(
  `Given this source inventory and the brief, assess coverage. What does the brief ask that the ` +
  `sources don't answer? Where do sources conflict? What should the human decide before we extract?\n\n` +
  `BRIEF (${cfg.deliverable} for ${cfg.audience}):\n${cfg.brief}\n\nINVENTORY:\n${inventoryText}`,
  { schema: ASSESS_SCHEMA, label: 'assess' }
)

// ── write editable artifacts ─────────────────────────────
phase('Assess')
const briefDoc =
  `# Brief\n\n` +
  `- **Deliverable:** ${cfg.deliverable}\n- **Audience:** ${cfg.audience}\n- **Sources:** ${cfg.sourcesDir}\n\n` +
  `## Objective\n\n${cfg.brief}\n\n` +
  `*Edit this file to refine scope before running /deliverable-extract.*\n`

const sourcesDoc =
  `# Sources & Coverage\n\n## Inventory\n\n${inventoryText}\n\n` +
  `## Coverage assessment\n\n${clean(assess.coverage)}\n\n` +
  `## Gaps (brief asks, sources don't cover)\n\n${assess.gaps.map(g => `- ${clean(g)}`).join('\n') || '- none noted'}\n\n` +
  `## Conflicts between sources\n\n${(assess.conflicts || []).map(c => `- ${clean(c)}`).join('\n') || '- none noted'}\n\n` +
  `## Questions for you (resolve before extract)\n\n${assess.questions.map(q => `- [ ] ${clean(q)}`).join('\n') || '- none'}\n\n` +
  `*Edit the inventory (cut sources, add notes) and answer the questions, then run /deliverable-extract.*\n`

await agent(
  `Create the directory "${dir}" if needed and write these two files with the Write tool, verbatim:\n\n` +
  `FILE 1 — "${dir}/brief.md":\n<<<\n${briefDoc}\n>>>\n\n` +
  `FILE 2 — "${dir}/sources.md":\n<<<\n${sourcesDoc}\n>>>\n\nConfirm both were written.`,
  { phase: 'Assess', label: 'write-artifacts' }
)

return {
  stage: 'gather',
  wrote: [`${dir}/brief.md`, `${dir}/sources.md`],
  sourcesFound: survey.sources.length,
  gaps: assess.gaps,
  questions: assess.questions,
  conflicts: assess.conflicts || [],
  next: 'Review sources.md (cut/confirm sources, answer questions), then run /deliverable-extract.',
}
