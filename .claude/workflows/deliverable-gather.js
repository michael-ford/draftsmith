/**
 * deliverable-gather — stage 1 of 3 (gather → extract → generate)
 * ───────────────────────────────────────────────────────────────
 * The "spec the inputs" seam. Gathers the raw material for the deliverable:
 * researches the web, reads any folder you point it at, and pulls from any
 * MCP integrations you name (Drive, Gmail, Notion, Slack, Linear, etc.).
 * Then it assesses coverage against the brief and writes editable artifacts.
 *
 * A dynamic workflow can't ask you anything mid-run, so the "where should I
 * gather from?" decision happens in the CONVERSATION before this launches:
 * Claude asks which channels to use (web, your folders, your connected MCP
 * integrations) and passes them in as the `sources` arg below.
 *
 * Artifacts written to <workDir>/deliverable-workspace/:
 *   brief.md          — the spec (task, deliverable type, audience). Edit to refine scope.
 *   sources.md        — inventory of everything gathered + coverage gaps + questions for you.
 *   gathered/*.md     — the raw research notes pulled from web / integrations.
 *
 * Run:  Workflow({ name: 'deliverable-gather', args: {
 *         workDir: '.',
 *         brief: '...', deliverable: 'brief', audience: '...',
 *         sources: 'web; my Google Drive "ClientX" folder; Gmail from jane@client.com',  // free-form, optional
 *         sourcesDir: './notes'   // optional — a local folder to also read
 *       }})
 * Then read sources.md, cut/confirm, answer the questions, and run /deliverable-extract.
 */

export const meta = {
  name: 'deliverable-gather',
  description: 'Stage 1/3: research the brief across chosen channels (web, folders, MCP integrations), then assess coverage',
  phases: [
    { title: 'Plan',     detail: 'turn the brief + chosen channels into concrete research tasks' },
    { title: 'Research', detail: 'gather from each channel in parallel, write raw notes' },
    { title: 'Assess',   detail: 'inventory everything, check coverage vs the brief, surface gaps + questions' },
  ],
}

const A = (typeof args === 'string') ? JSON.parse(args) : (args || {})
const cfg = {
  workDir:     A.workDir     || '.',
  brief:       A.brief       || 'Synthesize the material into a clear, evidence-backed deliverable.',
  deliverable: A.deliverable || 'report',
  audience:    A.audience    || 'an informed but non-expert decision-maker',
  sources:     A.sources     || '',          // free-form channel spec; '' => web research only
  sourcesDir:  A.sourcesDir  || '',          // optional local folder; '' => none
}
const dir = `${cfg.workDir}/deliverable-workspace`
const gatheredDir = `${dir}/gathered`

// strip stray tag-like fragments a model may leak into a string field
const clean = (s) => String(s || '').replace(/<\/?[a-zA-Z_][^>]*>/g, '').trim()

const PLAN_SCHEMA = {
  type: 'object',
  required: ['tasks'],
  properties: {
    tasks: {
      type: 'array',
      description: 'concrete research tasks to run in parallel',
      items: {
        type: 'object',
        required: ['channel', 'task', 'label'],
        properties: {
          channel: { type: 'string', enum: ['web', 'integration'], description: 'web search/fetch, or an MCP integration' },
          task:    { type: 'string', description: 'what to find, specifically' },
          label:   { type: 'string', description: 'short kebab-case id for the output filename' },
          tool:    { type: 'string', description: 'for integration tasks: which service/MCP to use (e.g. google-drive, gmail, notion)' },
        },
      },
    },
  },
}

const GATHERED_SCHEMA = {
  type: 'object',
  required: ['path', 'summary', 'relevance'],
  properties: {
    path:      { type: 'string', description: 'file written under gathered/, or "none" if nothing was found' },
    summary:   { type: 'string', description: 'one line on what was gathered' },
    relevance: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
  },
}

const INVENTORY_SCHEMA = {
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
          kind:      { type: 'string' },
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
    coverage:  { type: 'string' },
    gaps:      { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' } },
  },
}

// ── 1. Plan the research ─────────────────────────────────
phase('Plan')
const plan = await agent(
  `Plan the research for this deliverable.\n\nBRIEF (${cfg.deliverable} for ${cfg.audience}):\n${cfg.brief}\n\n` +
  `Channels the user chose to gather from: ${cfg.sources || '(none specified — default to web research)'}\n\n` +
  `Break this into concrete parallel tasks. Use channel "web" for anything you can find by searching/fetching the open web. ` +
  `Use channel "integration" for anything that should come from a named service (set "tool" to the service, e.g. google-drive, gmail, notion, slack, linear) — only if the user named it. ` +
  `Aim for 3–6 focused tasks that together cover the brief. Give each a short kebab-case label.`,
  { schema: PLAN_SCHEMA, label: 'plan-research' }
)
log(`Planned ${plan.tasks.length} research task(s)`)

// ── 2. Research each channel in parallel ─────────────────
phase('Research')
await agent(
  `Create the directory "${gatheredDir}" if it does not exist (use Bash: mkdir -p). Confirm.`,
  { phase: 'Research', label: 'prep-dir' }
)

const gathered = (await pipeline(
  plan.tasks,
  (t) => agent(
    (t.channel === 'web'
      ? `Research this on the open web using WebSearch and WebFetch. Pull real, citable facts and figures.\n\nTASK: ${t.task}\n`
      : `Gather this from the "${t.tool || 'named'}" integration. Use ToolSearch to find the relevant MCP tools for that service, then retrieve the material. If the tools are not available, say so and return relevance "none".\n\nTASK: ${t.task}\n`) +
    `\nWrite what you find as clean Markdown notes (with sources/links where relevant) to "${gatheredDir}/${t.label}.md" using the Write tool. ` +
    `Keep it factual, no padding. Then report the path, a one-line summary, and how relevant it turned out.`,
    { schema: GATHERED_SCHEMA, phase: 'Research', label: `gather:${t.label}` }
  )
)).filter(Boolean).filter(g => g.relevance !== 'none' && g.path && g.path !== 'none')
log(`Gathered ${gathered.length} source(s) from research`)

// ── 2b. Inventory any local folder the user provided ─────
let folderSources = []
if (cfg.sourcesDir) {
  const inv = await agent(
    `List and skim every file in the local folder "${cfg.sourcesDir}" (recurse). For each, give a one-line summary ` +
    `and rate relevance to this brief:\n\n${cfg.brief}\n\nUse Glob/Read/Bash. Return them with their real paths.`,
    { schema: INVENTORY_SCHEMA, phase: 'Research', label: 'inventory-folder' }
  )
  folderSources = inv.sources || []
  log(`Inventoried ${folderSources.length} file(s) from ${cfg.sourcesDir}`)
}

// consolidate everything into one source list
const allSources = [
  ...gathered.map(g => ({ path: g.path, kind: 'research', summary: g.summary, relevance: g.relevance })),
  ...folderSources,
]
if (!allSources.length) {
  log('Nothing gathered. Check the brief, the chosen channels, or whether WebSearch/MCP tools are available.')
  return { stage: 'gather', error: 'no material gathered', sources: cfg.sources, sourcesDir: cfg.sourcesDir }
}

// ── 3. Assess coverage + write artifacts ─────────────────
phase('Assess')
const inventoryText = allSources
  .map(s => `- [${s.relevance}] ${s.path} (${s.kind}) — ${clean(s.summary)}`).join('\n')

const assess = await agent(
  `Given this gathered material and the brief, assess coverage. What does the brief ask that the material does not answer? ` +
  `Where do sources conflict? What should the human decide before extraction?\n\n` +
  `BRIEF (${cfg.deliverable} for ${cfg.audience}):\n${cfg.brief}\n\nGATHERED:\n${inventoryText}`,
  { schema: ASSESS_SCHEMA, phase: 'Assess', label: 'assess' }
)

const briefDoc =
  `# Brief\n\n` +
  `- **Deliverable:** ${cfg.deliverable}\n- **Audience:** ${cfg.audience}\n` +
  `- **Gathered from:** ${cfg.sources || 'web'}${cfg.sourcesDir ? ` + folder ${cfg.sourcesDir}` : ''}\n\n` +
  `## Objective\n\n${cfg.brief}\n\n` +
  `*Edit this file to refine scope before running /deliverable-extract.*\n`

const sourcesDoc =
  `# Sources & Coverage\n\n## Inventory\n\n${inventoryText}\n\n` +
  `## Coverage assessment\n\n${clean(assess.coverage)}\n\n` +
  `## Gaps (brief asks, material doesn't cover)\n\n${assess.gaps.map(g => `- ${clean(g)}`).join('\n') || '- none noted'}\n\n` +
  `## Conflicts between sources\n\n${(assess.conflicts || []).map(c => `- ${clean(c)}`).join('\n') || '- none noted'}\n\n` +
  `## Questions for you (resolve before extract)\n\n${assess.questions.map(q => `- [ ] ${clean(q)}`).join('\n') || '- none'}\n\n` +
  `*Cut sources, add notes, answer the questions, then run /deliverable-extract. ` +
  `Want more channels (a folder, an integration)? Tell Claude and re-run gather.*\n`

await agent(
  `Write these two files verbatim with the Write tool.\n\n` +
  `FILE 1 — "${dir}/brief.md":\n<<<\n${briefDoc}\n>>>\n\n` +
  `FILE 2 — "${dir}/sources.md":\n<<<\n${sourcesDoc}\n>>>\n\nConfirm both were written.`,
  { phase: 'Assess', label: 'write-artifacts' }
)

return {
  stage: 'gather',
  wrote: [`${dir}/brief.md`, `${dir}/sources.md`, `${gatheredDir}/`],
  gatheredFromResearch: gathered.length,
  fromFolder: folderSources.length,
  gaps: assess.gaps,
  questions: assess.questions,
  next: 'Review sources.md (cut/confirm, answer questions), then run /deliverable-extract.',
}
