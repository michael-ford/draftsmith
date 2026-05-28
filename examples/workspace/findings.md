# Findings

*Extracted from 3 sources (31 findings). Edit before generating: delete noise, fix anything wrong, add a **bold note** to flag what must land in the deliverable.*

### examples/sources/survey-results.md
- **(high · runway-lead)** Runway ('how long will my money last') is the single most-requested feature at 58%, making it the strongest signal for what to build next and the natural lead direction.
  > "Tell me how long my money will last" — 58%
- **(high · runway-lead)** Free-text responses repeatedly converge on a single runway-style answer rather than a dashboard, reinforcing runway as the headline bet.
  > "give me one number: am I going to be ok" / "i want a runway number like a startup has"
- **(high · runway-lead)** The survey author independently flags the same insight: users want one answer, not a dashboard — directly supporting a runway 'one number' framing.
  > recurring theme = people want ONE answer, not a dashboard
- **(high · tax-set-aside-fast-follow)** Auto tax set-aside is the clear second priority at 51% and surfaces unprompted in free text, making it the logical fast-follow after runway.
  > "Automatically set aside money for taxes" — 51%
- **(high · tax-set-aside-fast-follow)** Tax pain is emotionally charged and currently unmet, strengthening the case for tax set-aside as a near-term follow-up.
  > "taxes are the worst part of freelancing and the app ignores them completely"
- **(high · tax-set-aside-fast-follow)** The author notes tax set-aside keeps recurring without prompting, indicating organic demand rather than a leading-question artifact.
  > the "set aside for taxes" thing keeps coming up unprompted
- **(high · churn-is-engagement)** Churn is overwhelmingly a disengagement and value problem (47% stopped opening + 23% nothing useful = 70%), not a feature-breadth problem — which is exactly what a runway 'one number' answer addresses.
  > "Stopped opening it / forgot about it" — 47% ... "Didn't tell me anything useful" — 23%
- **(high · scope-retention-not-pricing)** Price is a negligible churn driver at 6%, confirming this should be scoped as a retention bet rather than a pricing/monetization bet.
  > "Too expensive" — 6%
- **(high · reduce-manual-entry)** Manual data entry drives 19% of churn, and users praise bank sync while resenting manual work — automation (auto tax set-aside, invoice connection) reduces a real churn lever.
  > "Too much manual entry" — 19% ... "love the bank sync hate that I have to do everything else myself"
- **(medium · invoice-connection-tertiary)** Invoice connection is a meaningful third request (44%) and is framed by users as what would make the app feel 'smart' — a candidate for the roadmap after tax set-aside.
  > "Connect my invoicing / see unpaid invoices" — 44% ... "if it knew about my unpaid invoices it would actually be smart"
- **(high · deprioritize-dashboard-features)** Charts, household budgeting, and investing are all low-demand (12%, 9%, 7%) and should be explicitly deprioritized; the product is currently perceived as just a prettier spreadsheet.
  > "Better charts / reports" — 12% ... "honestly it's just a prettier spreadsheet right now"
- **(high · audience-fit)** The target user is squarely the irregular-income freelancer — 71% freelance/self-employed and 64% report unpredictable month-to-month income — matching Cadence's stated positioning.
  > 71% identify as freelance / self-employed / contractor ... 64% said income is "unpredictable month to month"
- **(medium · notifications-backfire)** Current notification/reminder design actively backfires, driving the disengagement loop — relevant to how a runway feature should re-engage users without anxiety.
  > "the daily reminders made me anxious so I turned them off and then forgot the app existed"

  _Gaps:_ Churn-reason percentages are based on only n=88 churned/downgraded users; the small base limits confidence in fine-grained breakdowns.; Survey measures stated preference (what users say would make the app useful), not revealed behavior — no evidence that shipping runway actually moves retention.; No baseline churn or retention rate is given, so the size of the addressable churn reduction cannot be quantified.; The 58% runway request is multi-select and undated against any control; no data on how a runway number should be calculated (cash on hand, expected invoices, smoothed income).; Author states data is 'raw' and not cleaned up, so exact figures may shift after de-duplication or coding of free text.; No segmentation showing whether runway demand differs between active vs churned users, or by income tier — unclear if the lead feature targets retention of the at-risk cohort specifically.; Price is dismissed at 6% as a churn driver, but the survey does not test willingness-to-pay or whether new features should sit behind a paywall (intentionally out of scope per review, but unmeasured).

### examples/sources/interview-priya.txt
- **(high · runway-primary)** The core job-to-be-done is answering 'can I afford a slow month' — a runway number, not budgeting categories or charts. This is the primary build direction.
  > The thing I actually care about is, can I afford to take a slow month. That's the whole question of my life lol.
- **(high · runway-primary)** User explicitly frames the need as a startup-style runway: a forward projection of when funds run out given a no-income period.
  > I need "if you don't get paid for 6 weeks, here's when you run out." Like a runway. People at startups get a runway number, why don't I.
- **(high · runway-primary)** The app's budgeting model assumes salaried, regular income (1st and 15th) and fails freelancers whose income arrives unpredictably — the runway must account for late invoices up to 60 days.
  > Like it assumes money comes in on the 1st and the 15th. Mine comes in whenever a client finally pays the invoice, which could be 60 days late.
- **(high · runway-primary)** The need is fundamentally about timing/cash-flow uncertainty, not reporting — reinforcing runway over analytics features.
  > the timing is everything. I don't need fancy charts.
- **(high · invoice-integration-fastfollow)** Invoice integration (pulling outstanding invoices from a separate invoicing tool) is the fast-follow that would lock in retention — the user states it would make her never leave.
  > And maybe pulled in my outstanding invoices so I'm not typing them in. I use a separate invoicing tool. If those talked to each other I'd probably never leave.
- **(high · churn-evidence)** Churn risk is real and active: despite paying for the app, the user built her own spreadsheet to get the runway answer the product doesn't provide.
  > I actually built a spreadsheet for this myself which is embarrassing because I'm paying for the app.
- **(high · churn-evidence)** Engagement is low — weekly or less — which is consistent with churn risk; the product isn't delivering the one answer she opens it for.
  > I open it like... once a week? Maybe less.
- **(high · keep-what-works)** Bank sync is the current retention anchor and the reason she still uses the app — build on top of this strength, don't disrupt it.
  > the import from my bank is solid, that's why I stay. setup was easy.
- **(high · notifications-signal-not-noise)** Current notifications are noise and were all disabled; any runway feature should surface meaningful alerts (e.g. runway threshold) rather than per-transaction spending pings.
  > the notifications are annoying, I turned them all off. "You spent \$40 on coffee" ok and? not helpful. tell me something that matters.
- **(high · positioning)** The underlying product gap is positioning the freelancer as a mishandled salaried employee rather than a distinct user with irregular income — the strategic framing for the retention bet.
  > I just wish it understood that freelancers aren't just employees with a worse schedule.

  _Gaps:_ Single-interview source (n=1, Priya). No evidence on how representative her runway need is across the broader churning user base — recommendation rests on one churn-risk persona.; No quantitative churn data, cohort retention figures, or measure of how many users have built their own spreadsheet workarounds.; Tax set-aside (the decided fast-follow after runway) is not mentioned anywhere in this interview — no verbatim user evidence for it from this source.; The specific invoicing tool she uses is unnamed ('a separate invoicing tool'), so integration scope/feasibility (which providers to support first) is unknown.; No data on willingness to pay, current price, or pricing sensitivity — though per review scope, pricing is intentionally out of scope.; Unclear what runway inputs are reliably available: how accurately can outstanding-invoice timing be predicted given clients pay up to 60 days late?; No competitive context on whether other freelancer budgeting tools already offer a runway number.

### examples/sources/interview-marcus.txt
- **(high · Churn root cause)** Churn was driven by lack of insight, not product defects: the app surfaced data he already had rather than answering whether he's financially okay. This is the core retention failure to fix.
  > It never told him anything he didn't already know. "I know I spent money. I want to know if I'm ok."
- **(high · Runway / dry-spell survival (lead bet))** Surviving income gaps (dry-spell/runway) is one of two top anxieties keeping this lumpy-income freelancer up at night, making it the broadest retention lever and the lead direction.
  > those are the two things that actually keep me up at night.
- **(high · Runway / dry-spell survival (lead bet))** Both the runway and tax features would directly reverse churn: the user states he would return immediately if the app delivered them.
  > if it did the tax thing and the can-I-survive-a-dry-spell thing, yeah, instantly.
- **(high · Tax set-aside (fast-follow))** Automatic tax carve-out showing 'safe to spend' vs reserved tax money is the highest-intensity feature ask and a strong fast-follow to runway. He frames manual quarterly tax set-aside as an active stressor.
  > if the app automatically carved out a tax % from every payment and showed him "safe to spend" vs "this is the tax man's money" he'd pay double.
- **(high · Lead with the number)** The single most-wanted metric is a clear 'how much is really mine' number; everything else is treated as noise. This points the build toward one decisive figure, not more dashboards.
  > the number I actually want is "how much of this is really mine." everything else is noise.
- **(high · No daily babysitting)** Any feature requiring daily manual upkeep will fail to retain this segment; he drifted from both Cadence and YNAB for this reason. The build must be automatic/passive.
  > anything that needs daily babysitting loses.
- **(high · Out of scope)** Charts, spending categories, social/sharing, and the mobile widget are explicitly not valued and should stay out of scope.
  > Did NOT care about: charts, spending categories, social/sharing stuff, the mobile widget.
- **(high · Bones are fine)** Foundational plumbing is sound and does not need rework: onboarding and bank sync are solid, freeing next-quarter investment for the insight layer.
  > Said onboarding was good. Bank sync good. "the bones are fine."

  _Gaps:_ Single-interview, n=1 (one churned freelance developer with lumpy contract income). No evidence on whether the runway and tax pain generalizes across Cadence's broader user base or other freelancer income profiles.; No quantification of churn: unknown what fraction of churned users cite the same 'told me nothing new' / tax / runway reasons, so prioritization can't yet be sized.; 'Runway/dry-spell survival' is named as a need but the user gave no concrete spec for it (e.g., how runway should be calculated, what time horizon, what triggers an alert) — open product-definition question.; Willingness-to-pay signal ('he'd pay double', 'would pay double') exists but is out of scope per the retention-bet framing; left as a future monetization question, not used here.; No data on what tax percentage logic users expect (flat %, jurisdiction-aware, user-set) — implementation detail unresolved.; Support latency was raised (4-day reply) but flagged by the user as minor; not a churn driver, noted only for completeness.
