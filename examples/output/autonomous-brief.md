# The "Am I OK?" Number: Cadence's Next-Quarter Bet Against Churn

*Cadence loses users to silence, not price. The app reports what freelancers already know instead of answering the one question they actually have: "Can I afford a slow month?" Next quarter we should answer it with a single income-timing-aware runway number — the "Am I OK?" number — and re-earn the open with alerts that fire only when that number moves.*

## The Decision

**The direction: ship one number — the "Am I OK?" number.** An income-timing-aware runway figure that answers "Can I afford a slow month?" Everything else in scope exists to serve that one job:

- **Signal-only notifications** — the re-engagement channel for the number. Alerts fire *only* when the runway figure meaningfully changes, never "$40 on coffee."
- **Automatic tax set-aside** — makes the runway number honest by separating "safe to spend" from "the tax man's money." Scoped stretch (see Sequence).
- **Unpaid-invoice awareness** — makes the runway number accurate by pulling in money that's owed but not yet paid. Scoped stretch (see Sequence).

This quarter commits to the runway number plus signal-only notifications. Tax set-aside and invoice awareness are scoped stretch goals pending engineering input — high-demand components of the same job, not separate bets.

**Don't build:** charts/dashboards, household/social, investment tracking, or the mobile widget.

**Why:** churn is a value-and-engagement problem, not a price one (price is 6% of churn). The runway number gives the disengaged a concrete reason to reopen the app and gives everyone an answer instead of a report — in a lane no incumbent appears to own (YNAB is work, QuickBooks is filing, Monarch is for couples).

**Validate before full build.** The riskiest link is whether notifications actually re-engage the "forgot about it" cohort. *Proposed (not from research):* A/B test signal-only re-engagement against a reopen-within-48h target before committing the full quarter. Details in Watch.

## Confidence and Evidence Base

The affirmative case below rests on four sources of differing weight. Read the case with these denominators in mind; the genuine risks are consolidated in Watch.

- **n=412** — full Q2 survey (active plus recently-churned users). Source for demographics and feature-request demand. Note: most respondents are *not* churned, so these are strong demand signals, not proven retention impact.
- **n=88** — the churned-user subset within that survey. Source for *churn reasons only*. These are correlational self-reports.
- **Two interviews** — Marcus (churned developer) and Priya (active 3-year subscriber). Both happen to confirm the runway thesis, which is suggestive, not proof, at n=2.
- **One competitor scan** — an internal "rough notes" document that self-describes as non-exhaustive and "don't share." It has no methodology, market sizing, or external validation. The competitive-whitespace argument below rests entirely on it; treat those claims as directional and commission a real teardown before betting heavily on the moat.

One overlap is unproven throughout: we cannot confirm the users who *requested* runway/tax/invoices (n=412) are the same users who *churned* (n=88). Where this matters, it's flagged.

## Why This Is the Right Problem: Disengagement, Not Price

Among churned users (n=88), 70% left for value/engagement reasons — 47% "stopped opening it / forgot about it" and 23% "didn't tell me anything useful." Only 6% cited price. Cutting price or buying acquisition would pour money into a bucket whose leak is elsewhere: we'd acquire users who churn for the same reason.

Marcus, a churned freelance developer, names the mechanism: "It's not that it's bad. I just stopped opening it." The cause is that the app never told him anything he didn't already know, borne out by what he says he wants: "I know I spent money. I want to know if I'm ok." Churn here is passive disengagement, not dissatisfaction.

There is a sharper, behavioral signal of unmet need, though it comes from a single retained user, not the churned cohort: people pay for Cadence and still keep their own spreadsheet. Priya, an active subscriber of three years, built her own runway spreadsheet — "embarrassing because I'm paying for the app." This is one retained interviewee, not a measured churn precursor, so it is best read as evidence of a live, actively felt value gap: even a loyal paying user does manual work the product should be doing. That gap is exactly what the runway number closes — and it is the strongest affirmative reason to believe a runway answer would pull disengaged users back: the need is real enough that someone already pays *and* does the work by hand.

## What They're Actually Asking For: One Answer, Not a Dashboard

Demand converges on a single job. From the full survey (n=412), the top three requests all answer one question:

- "Tell me how long my money will last" — **58%** (runway)
- "Automatically set aside money for taxes" — **51%**
- "Connect my invoicing / see unpaid invoices" — **44%**

Users phrase it the same way unprompted: "give me one number: am I going to be ok," "a runway number like a startup has" (survey free-text); "if you don't get paid for 6 weeks, here's when you run out" (Priya); "the number I actually want is 'how much of this is really mine'" (Marcus). Cadence today is "just a prettier spreadsheet" (survey) — it reports what users already know instead of interpreting it for irregular income.

Pull for everything else is weak: charts 12%, household 9%, investing 7%. They want one answer, not a dashboard.

## How the Build Maps to Churn Drivers

This is the spine of the case: each driver maps to a component of the one job. The churn-% column is exit reasons from churned users (n=88); the request-% column is stated demand from all respondents (n=412). The bet is that the build satisfying the second will retain the first — an inference across the two populations, not a measured identity.

| Churn driver (n=88) | What attacks it | Supporting demand (n=412) |
|---|---|---|
| Forgot / stopped opening — 47% | Signal-only runway notifications that fire only when the number moves | — |
| "Didn't tell me anything useful" — 23% | The "Am I OK?" runway number itself (an answer, not a chart) | runway 58% |
| Too much manual entry — 19% | Tax set-aside plus invoice awareness via existing bank sync | taxes 51%, invoices 44% |
| Too expensive — 6% | Out of scope (price is not the leak) | — |

## Why It Fits the Segment and Wins Competitively

The research is squarely on-segment: of 412 respondents, 71% identify as freelance/self-employed and 64% call income "unpredictable month to month." The product-market gap is structural — budgeting assumes salaried 1st/15th timing. Priya: "it assumes money comes in on the 1st and the 15th. Mine comes in whenever a client finally pays." That timing mismatch — not amount or categorization — is the anxiety we'd solve.

On competition, the single internal scan concludes "nobody owns low-effort peace of mind for irregular income" and calls "runway for freelancers" an open lane: YNAB is too much work, Monarch/Copilot target households, and Mint's shutdown left an orphaned pool. QuickBooks Self-Employed is the one real overlap — it does tax estimates, mileage, and invoices, so tax set-aside is not unique to us. Our defensible wedge is the runway/timing job QBSE lacks.

These competitive claims all trace to one rough, non-exhaustive internal document with no UX comparison or sizing. They are directionally useful for picking the lane, but the moat itself is unverified — a real competitive teardown should precede heavy investment on the "we win on feel" assumption.

## Constraints That Make or Break It

Three non-negotiables, or we rebuild the churn we're fixing.

1. **Near-zero manual upkeep.** Manual entry is the #3 churn reason (19%) and the named "too much work" that drove churned users off YNAB. We lean on the bank sync users already love. Priya: "love the bank sync, hate that I have to do everything else myself."
2. **Signal-only notifications.** Daily/trivial alerts ("$40 on coffee") drove users to disable notifications and then forget the app — the survey free-text links them directly: "the daily reminders made me anxious so I turned them off and then forgot the app existed." Notifications fire only when the runway number meaningfully changes.
3. **Built for low-frequency check-ins.** Engagement is weekly-or-less (Priya), so optimize for high-value infrequent moments, not daily habit-building.

**Engineering input is required before locking scope.** The sources contain no engineering input; they establish only that users like the existing bank sync. "Powered by existing bank sync" is a fair starting point for the runway calculation, but tax set-aside needs reliable income classification and a set-aside mechanism (separate account or virtual bucket) beyond raw transaction sync, and invoice awareness needs third-party invoicing integrations — *which* tools is an open question. Rough sizing to set expectations: runway = M, tax set-aside = L, invoice awareness = L.

## Scope and Sequence

**Committed this quarter:** the "Am I OK?" runway number on existing bank sync, plus signal-only notifications.

**Scoped stretch (pending eng input):** automatic tax set-aside (51% demand; QBSE overlap noted) and unpaid-invoice awareness via integration with users' existing invoicing tools (44%). These are fast-follow components of the same number, not separate bets — but they carry real dependencies (L/L above) and could slip if engineering scoping says so. Do not treat them as locked.

**Out of scope, with the evidence behind each cut:**

- Charts/reports (12%), household/social (9%), investment tracking (7%) — cut on survey demand (n=412); the recurring theme is "people want one answer, not a dashboard."
- Mobile widget — cut on a single interview (Marcus didn't care); weak basis, so this is low-conviction and revisitable if cheap.
- Mint-orphan acquisition pool (users displaced by Mint's shutdown) — real but low willingness-to-pay ("cheapskates by definition," per the scan); must not divert build effort from retention.

## Watch: What We're Betting On and How We De-Risk It

Two load-bearing risks, plus a sampling caveat. The rest of the brief reads with conviction; these are the places to stay honest.

**1. Re-engagement loop (highest risk) — and a contradiction in the channel.** The whole case assumes notifications pull back the disengaged. But the 47% "forgot about it" cohort is, by definition, people who stopped opening the app — and the free-text shows they got there by turning notifications *off* first ("I turned them off and then forgot the app existed"). Priya did the same. So signal-only notifications, however well-tuned, cannot reach the very users they're meant to re-engage if those users have already silenced the channel. *Proposed (not from research):* treat "can we even reach the disengaged" as a prerequisite test, and add a re-engagement path that does not depend on push — e.g., an email runway digest, a re-onboarding email, or surfacing the number in-app on the user's next organic open. A/B test signal-only re-engagement against a reopen-within-48h target before full build.

**2. Runway accuracy (active-harm risk).** This is the number users will make real financial decisions on. A wrong number erodes trust and could *accelerate* churn — the core failure mode of the chosen feature. *Proposed mitigation:* backtest the runway model against historical income/payment data, show a confidence range rather than a false-precision single figure, and define explicit failure behavior when payment timing is unknown (degrade to a range or withhold the number rather than guess).

**3. Sampling limits.** Churn-reason and qualitative evidence is thin: n=88 self-reports plus two interviews that both confirm the thesis, and a single non-exhaustive competitor doc. Consider a handful more churned-user interviews and a proper competitive teardown before the full-quarter commitment.

**Impact framing.** Rather than claim we "attack 70% of churn," set a baseline and test. *Proposed:* before building, measure current 90-day churn. If signal-only re-engagement reaches even a fraction of the 47% "forgot" cohort and the runway answer addresses the 23% "not useful" cohort, 90-day churn should fall. Leading indicator and go/no-go signal: % of users who reopen within 48h of a runway-change notification. Single-user enthusiasm — Marcus would "pay double" for tax set-aside; Priya would "probably never leave" with invoices plus runway — is aspirational signal, not willingness-to-pay evidence, and is not counted toward the case.

**Metric to move:** 90-day churn, from a to-be-measured baseline. Leading indicator: reopen-within-48h-of-runway-notification rate.
