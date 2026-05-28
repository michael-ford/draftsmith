# Draftsmith

**Turn a folder of messy source material into a polished, self-critiqued written deliverable — using Claude Code [dynamic workflows](https://code.claude.com/docs/en/workflows).**

Anthropic pitched dynamic workflows for *code* — bug sweeps, migrations, audits. This is the same machinery pointed at **knowledge work**: research, synthesis, and drafting. Drop a pile of interview transcripts, PDFs, survey dumps and rough notes into a folder, and get back a structured deliverable that has been drafted from several angles and torn apart by adversarial critics before you ever see it.

It ships in two flavors:

| | What it is | Use it when |
|---|---|---|
| **Autonomous** (`draftsmith`) | One fire-and-forget workflow: sources → finished deliverable | You want a strong first draft with zero babysitting |
| **Staged** (`gather` → `extract` → `generate`) | Three workflows with **human review seams** between them | The output ships to someone and your judgment needs to be in the loop |

Both use the same engine underneath: parallel extraction, a judge panel that picks the best outline, and a critique-and-revise loop that runs until the draft passes.

---

## Requirements

- **Claude Code v2.1.154+** with dynamic workflows enabled (research preview; on Pro, turn them on in `/config`).
- A paid plan (Pro/Max/Team/Enterprise), or API/Bedrock/Vertex/Foundry access.
- Dynamic workflows spend **a lot** of tokens — see [What it costs](#what-it-costs).
- **Optional, for formatted output:** [`pandoc`](https://pandoc.org) for `.docx` export, and [`uv`](https://docs.astral.sh/uv/) (for `python-pptx`) for `.pptx`. Without them, output stays Markdown — see [Output formats](#output-formats).

## Install

**Fastest — clone and try it in place.** The workflows live in `.claude/workflows/`, so they're active the moment you open Claude Code inside the clone:

```bash
git clone https://github.com/michael-ford/draftsmith
cd draftsmith && claude          # /draftsmith is live; run it on examples/sources
```

**To use it in your own projects**, copy the four files where you want them:

```bash
# project-local (shared with your repo)
cp .claude/workflows/*.js /path/to/your-project/.claude/workflows/

# or personal (every project, just you)
cp .claude/workflows/*.js ~/.claude/workflows/
```

They show up as `/draftsmith`, `/deliverable-gather`, `/deliverable-extract`, and `/deliverable-generate` in `/` autocomplete.

> **Why not a plugin?** Claude Code plugins can bundle skills, agents, hooks, and MCP servers — but [not workflows](https://code.claude.com/docs/en/workflows) (there's no `workflows/` plugin component yet). Committing them to `.claude/workflows/` in a repo *is* the documented way to share workflows.

---

## Quick start — the autonomous one-shot

Put your raw sources in a folder, then in Claude Code:

```
Run a workflow: draftsmith on ./examples/sources —
a product brief for the team recommending what to build next quarter to reduce churn.
```

Claude launches it in the background. Watch with `/workflows`. ~8 minutes later you have a finished brief at your output path.

A real run on the included [example sources](examples/sources/) produced [`examples/output/autonomous-brief.md`](examples/output/autonomous-brief.md) — and the critic loop caught a genuine contradiction no single pass would: the recommended fix (signal-only notifications) **can't reach the very users it targets**, because the "forgot about it" churn cohort had turned notifications off first. That's the adversarial review doing its job.

---

## The staged pipeline — keeping your judgment in the loop

A dynamic workflow **can't pause for input mid-run** — by design, it runs to completion in the background. So human review can't live *inside* a workflow. Instead it lives *between* workflows, and the interface is a set of **editable Markdown files** in a visible `deliverable-workspace/` folder.

The three stages are three places to apply judgment:

```
/deliverable-gather    → spec the INPUTS
   writes  brief.md, sources.md
   🧑 you: confirm/cut sources, answer the spec questions, set the direction

/deliverable-extract   → spec the SUBSTANCE
   writes  findings.md
   🧑 you: trim noise, fix errors, **bold** what must land in the deliverable

/deliverable-generate  → spec the SHAPE
   writes  outline.md  (with stopAfterOutline:true)
   🧑 you: reorder, retitle, rewrite the thesis, cut a section
   then     → draft + critic loop → the finished deliverable
   🧑 you: review; re-run with notes if needed
```

### How your decisions actually flow

You steer through **two channels**, and you can mix them freely at every seam:

1. **The conversation** — tell Claude what you want (*"drop the competitor notes, lead with runway"*) and it edits the workspace files for you.
2. **The files** — open `brief.md` / `sources.md` / `findings.md` / `outline.md` in your editor and mark them up directly.

The file is the **contract between stages**. Because a workflow can't ask you anything, the next stage simply reads whatever's in the file. *Editing the doc is how you give input to an un-pausable process.* It's also how knowledge workers already work — strike a line, bold a point, rewrite a sentence — so it's a lower-friction channel than describing every change in prose.

### Walkthrough (the actual experience)

Using the included example — turning user research into a product brief:

1. **Kick off gather.** *"Turn the research in ./examples/sources into a product brief for the team. Run /deliverable-gather."* It runs ~2 min in the background; your session stays free.

2. **Seam 1.** Claude reports back: it wrote `brief.md` + `sources.md` and surfaced the open questions — *runway or tax first? what's the churn baseline? is invoicing in scope?* You decide. Maybe you tell Claude *"lead with runway, sequence tax, drop the competitor scan — too rough,"* or you open the files and edit them yourself. ([See what these look like](examples/workspace/).)

3. **Run extract.** *"/deliverable-extract."* It reads your *edited* files, skips the dropped source, fans out one extractor per remaining source, and writes [`findings.md`](examples/workspace/findings.md) (~3 min). Because you wrote "lead with runway," the findings come back framed around runway — **your decision shaped the substance, not just the file list.**

4. **Seam 2.** You skim `findings.md`, delete a few noisy findings, and **bold** the two stats you insist must appear. Save.

5. **Run generate (outline first).** *"/deliverable-generate, stop after outline."* A judge panel weighs three competing outlines and writes `outline.md` (~1 min). You reorder sections, rewrite the thesis in your voice, kill one. Save.

6. **Run generate again.** *"/deliverable-generate."* It drafts from your edited outline, runs the 5-critic loop until the draft passes, and writes the finished deliverable. Read it; to revise, tweak `findings.md`/`outline.md` and re-run just this stage.

### Why this beats one-shot for real work

- **You're never staring at a spinner** — everything runs in the background.
- **Decisions are durable.** Your calls live in `brief.md`/`findings.md`, not a chat that scrolls away. Close the laptop, come back tomorrow, the spec is intact. (This replaces any `/clear`-between-steps dance — state lives in files, not the conversation.)
- **Cheap iteration on the expensive last mile.** Don't like the draft? Edit the outline and re-run *only* `generate` — you don't redo extraction.

> ⚠️ The seams are only as good as your attention. Blow past `findings.md` without reading it and you've skipped the alignment step — you're back to fire-and-forget.

---

## What it costs

Real measured runs on the four example sources (your mileage varies with source size, sections, and critique rounds):

| Workflow | Agents | Tokens | Wall-clock |
|---|---:|---:|---:|
| `draftsmith` (full autonomous) | 29 | ~925K | ~8.5 min |
| `deliverable-gather` | 3 | ~90K | ~2 min |
| `deliverable-extract` (3 sources) | 5 | ~155K | ~3.5 min |
| `deliverable-generate` | ~20 | ~700K+ | ~8 min |

The **critique loop dominates** (5 critics × N rounds + a full-draft revise each round). Turn it down with `maxCritiqueRounds`, or use a smaller model for routine runs (check `/model` first). These count toward your plan's usage like any session.

Format export is cheap by comparison — `docx` adds one `pandoc` render agent; `pptx` adds one restructure+render agent. (Iterating? Re-running a finished workflow with a changed `format` resumes from cache and only re-runs the export — ~60K tokens, not a fresh ~900K.)

---

## How it works under the hood

Four dynamic-workflow patterns, applied to writing instead of code:

- **Fan-out (`parallel`/`pipeline`)** — one extractor per source, one drafter per section, all concurrent.
- **Judge panel** — three agents propose outlines from different structural angles (evidence-first, decision-first, narrative arc); an editor agent picks the strongest and merges in the best of the others.
- **Convergence loop** — five adversarial critics review the draft on distinct axes (accuracy, clarity, structure, persuasiveness, gaps); if any flags a *major* issue, the draft self-revises and re-runs, until they pass or `maxCritiqueRounds`.
- **Schema-validated output** — every extraction/outline/critique is a validated object, so structure is enforced, not hoped for.

Workflows never touch the filesystem directly (the runtime forbids it) — every read and write is done by an `agent()`. The script just coordinates.

## Output formats

The deliverable is always written as **Markdown** first (the reliable floor). Set `format` to also export a formatted file:

- **`md`** (default) — clean Markdown. Zero dependencies.
- **`docx`** — rendered with `pandoc` (`--from gfm`), preserving headings, bold/italic, tables, and blockquotes. Falls back to `python-docx` or LibreOffice `soffice`; if none are installed, you keep the `.md` and the run tells you so.
- **`pptx`** — a deck, produced in **two steps**: the agent first *re-authors* the prose into a slide outline (≤6 bullets per slide — this is real writing, not a format conversion), then renders with `python-pptx`. Falls back to a Markdown slide outline if `uv`/`python-pptx` are absent.

> Note the split: **`deliverable`** controls the *type and structure* (proposal vs. report vs. brief); **`format`** controls the *file type* you get out. They're independent. The original idea of "branded templates" is intentionally left out — this ships plain, clean files you can drop your own template onto.

## Customize

Arguments (all optional; sensible defaults):

| Arg | Used by | Default | Meaning |
|---|---|---|---|
| `sourcesDir` | gather, autonomous | `./sources` | folder of raw source files |
| `deliverable` | all | `report` | `report` \| `proposal` \| `brief` \| `memo` |
| `brief` | gather, autonomous | generic | the objective / what the deliverable must do |
| `audience` | gather, autonomous | generic | who it's for |
| `workDir` | staged | `.` | where `deliverable-workspace/` lives |
| `outputPath` | generate, autonomous | `./deliverable.md` | where the finished file is written (extension is normalized to the chosen `format`) |
| `format` | generate, autonomous | `md` | `md` \| `docx` \| `pptx` — see [Output formats](#output-formats) |
| `stopAfterOutline` | generate | `false` | stop after writing `outline.md` for the outline gate |
| `maxCritiqueRounds` | generate, autonomous | `3` | cap on the critique-revise loop |

Want a different deliverable type, more outline angles, or different critic axes? They're plain arrays near the top of each script — edit and re-run.

## License

MIT — see [LICENSE](LICENSE). Remix it for your own deliverable types.
