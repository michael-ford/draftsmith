# Sources & Coverage

## Inventory

- [high] **LEAD SOURCE — anchor the case on these churn-driver numbers.** examples/sources/survey-results.md (notes) — Q2 in-app survey, 412 responses (active + churned): 71% freelancers, 64% unpredictable income; top requests are runway (58%), auto tax set-aside (51%), invoice connection (44%) while charts/household/investing all <12%; churn driven by disengagement ('stopped opening it' 47%, 'didn't tell me anything useful' 23%, 'too much manual entry' 19%, only 6% price); free-text repeatedly asks for 'one number: am I going to be ok.'
- [high] examples/sources/interview-priya.txt (transcript) — Churn-risk illustrator (3 yrs, irregular income) opens app weekly at most; her core question is 'can I afford a slow month' and she wants a startup-style runway that accounts for 60-day-late invoices; built her own spreadsheet despite paying, says invoice integration would mean she'd 'never leave'; loves bank sync, hates noisy 'you spent $40 on coffee' notifications.
- [high] examples/sources/interview-marcus.txt (transcript) — Churned freelance developer (lumpy income) drifted off because the app 'never told him anything he didn't already know'; would pay double for automatic tax carve-out showing 'safe to spend' vs 'tax man's money' and for dry-spell/runway survival; doesn't care about charts, categories, social, or widgets; says onboarding and bank sync are solid ('the bones are fine'). Anything needing daily babysitting loses him.
- [low] DROP — too rough/non-exhaustive to weight in the evidence base. examples/sources/competitor-notes.md (notes) — Internal competitor scan: YNAB is high-effort, QuickBooks Self-Employed does taxes but feels like accounting work, Monarch/Copilot target couples, Mint is dead; the biggest real competitor is DIY spreadsheets (users keep one alongside paying). Concludes nobody owns 'low-effort peace of mind for irregular income'; tax set-aside is defensible vs all but QBSE, and 'runway for freelancers' is an open lane.

## Coverage assessment

Strong for a directional recommendation; thin for a quantified business case. The four sources converge tightly on the core narrative: churn is an engagement/value problem (47% "stopped opening it," 23% "didn't tell me anything useful"), not price (6%). The same two jobs-to-be-done surface in every source — (1) runway / "can I survive a slow month" and (2) automatic tax set-aside / "what's really mine" — and they map cleanly onto the survey's top requests (runway 58%, tax 51%, invoice connection 44%) while non-freelancer features (charts, household, investing) sit under 12%. The competitor scan independently confirms both directions are defensible open lanes ("nobody owns low-effort peace of mind for irregular income"; runway is "an open lane"; tax is defensible vs all but QBSE). Both interviewees praise the existing bank-sync/onboarding ("the bones are fine"), so the recommendation can credibly be framed as building ON the existing engine rather than rebuilding. This is enough to make a clear, evidence-backed case for a specific direction (runway and/or tax set-aside, leaning on existing bank sync, killing noisy notifications). What the sources do NOT support is the quantitative spine a founder will want: actual churn rate, revenue at risk, effort/cost to build, or proof that either feature causally reduces churn. The brief asks to "reduce churn" and "recommend what to build next quarter" — the WHAT is well-evidenced; the HOW MUCH IT MATTERS and WHICH ONE FIRST are not.

## Gaps (brief asks, sources don't cover)

- Churn baseline and revenue at risk: no actual churn rate, MRR, LTV, or count of at-risk users. 'Reduce churn' can't be sized or prioritized against effort without it.
- Runway vs tax — which first? Sources show both are wanted (runway 58% / tax 51% in survey; Priya skews runway, Marcus skews tax), but nothing tells us which moves retention more, so the 'specific direction' the brief demands requires a judgment call the data doesn't settle.
- Build cost / feasibility: no engineering estimate, and critically no information on whether invoicing integrations (the 44% ask, Priya's 'never leave' trigger) are technically/contractually feasible — which invoicing tools, API access, data partnerships.
- Causal evidence: requests and stated intent ('I'd pay double,' 'never leave') are aspirational. No experiment, behavioral data, or returning-churned-user evidence that shipping these features actually retains users.
- Willingness to pay / pricing: Marcus says 'pay double' but survey shows only 6% churn on price and Mint-orphan segment are 'cheapskates' — no data on whether new value supports a price change or is purely retention.
- Sample representativeness and segment sizing: 412 survey + 2 interviews, both interviewees are exactly the target persona. No read on the 29% non-freelancers, the side-income (18%) and small-business (11%) segments, or whether higher-income lumpy earners (Marcus) vs near-zero-month earners (Priya) want different things.
- Quantitative weight of free-text themes: 'one number: am I going to be ok' is compelling but anecdotal — no count of how many of 412 expressed it.
- Tax compliance/liability scope: 'safe to spend vs tax man's money' implies giving tax guidance (rates, jurisdictions, quarterly estimates). No coverage of regulatory/liability exposure or multi-region tax logic.
- Notification redesign: both interviewees hate noisy notifications and one churned partly because reminders caused anxiety, then she forgot the app — but the sources don't say what GOOD re-engagement looks like, leaving the engagement fix (the actual churn driver) under-specified.

## Conflicts between sources

- Emphasis split between the two interviewees: Priya's #1 need is invoice-aware runway (slow-month survival, 60-day-late invoices); Marcus's #1 is automatic tax carve-out and explicitly does NOT mention invoices. Same churn cause, different lead feature — a priority tension, not a factual contradiction.
- Mint-orphan opportunity vs price sensitivity: competitor notes flag chasing Mint's orphaned users but calls them 'cheapskates by definition,' which sits awkwardly against any plan to add premium value / raise prices on the back of these features.
- Invoice integration ranks 3rd in the survey (44%) and is a 'never leave' trigger for Priya, but Marcus (a churned user — the actual churn case) doesn't value it at all; weighting it heavily risks optimizing for a retained power user over the churned segment.

## Questions for you (resolve before extract)

- [ ] Decision the data can't make for you: do we lead with runway or tax set-aside next quarter (or sequence both)? Pick the primary retention bet — the sources justify either but don't rank them.
- [ ] What is our actual churn rate and revenue at risk, and what retention lift would make this quarter a success? Needed to size the bet and define success.
- [ ] Is invoicing integration in scope for next quarter, and if so which tools — i.e., do we have or can we get API access? This gates Priya's 'never leave' feature and the 44% request.
- [ ] Are we willing to take on the compliance/liability of tax guidance (set-aside %, jurisdictions, quarterly estimates), or do we ship a simpler 'set aside X%' bucket with no tax advice?
- [ ] Is the goal pure retention, or also monetization (price increase / new tier)? Marcus's 'pay double' vs the Mint-cheapskate segment pull in opposite directions.
- [ ] Scope of the engagement/notification fix: is redesigning notifications and the 'one number' home screen part of this quarter, given the real churn driver is disengagement rather than missing features?

*Edit the inventory (cut sources, add notes) and answer the questions, then run /deliverable-extract.*
