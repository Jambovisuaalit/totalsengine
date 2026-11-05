> Scope: **RESEARCH CONTRACT / prototype scope**. Requirements apply to the named component. Old current-state, dependency and deployment observations are superseded.
> Current operational status, storage behavior and release gates: [PROJECT_STATUS.md](PROJECT_STATUS.md).

# NBA Totals Evidence Core v0 — isolated research

**Status: DRAFT / OFFLINE / SYNTHETIC-ONLY / NO PUBLISHED SIGNALS.**

Option A establishes an isolated Python 3 standard-library core in
`nba_totals_research/`. No DoctoreAI imports, app routing, provider
HTTP calls, API keys, odds subscriptions, personal data, trading, or
deployment changes.

## Implemented gates

- **Market:** canonical game UUID, exact OVER/UNDER, identical total
  line, matching NBA full-game-including-OT settlement scope and tipoff.
  Never compare OVER 228.5 with OVER 229.0 or UNDER 228.5.
- **Time:** quotes and assessments must fall between scheduled T−65 and
  T−60 with timezone-aware timestamps; provider publication timestamp
  at most 120 seconds old; quote at most 120 seconds old at evaluation.
  Stale, live, unavailable, mismatched and duplicate-book quotes fail.
- **Probabilities:** mixtures of explicitly *conditional* full-game
  point distributions, given no overtime and given overtime, with
  separate overtime probability. No model training is included.
- **Push-aware EV:** P(win) × (decimal_odds − 1) − P(lose), with zero P/L
  contribution for a push. Line shopping selects highest eligible odds.
- **Private paper trail:** a write-once local SHA-256-named receipt
  (mode 0600); cannot overwrite a previous receipt. No provider raw
  response bodies are stored by this module.

**Important limitations:** An HTTP quote and locally supplied timestamp
do not prove a particular stake was executable at a bookmaker, nor do
they independently authenticate the original pre-tipoff observation.
The model receives synthetic probability inputs and has no independently
validated calibration or evidence of expected profit. A provided report
hash is not an independently verified report. Even positive calculated
EV is always `PAPER_CANDIDATE` and `publication_allowed=false`.

Publication is blocked by four explicit reasons: missing independent
model attestation, missing actual bookmaker acceptance evidence, missing
trusted provider/source timestamp evidence, and unapproved data/betting
rights. No claim of real profits, ROI or CLV is made.

## Synthetic tests

```bash
python3 -m unittest discover -s tests_nba_totals -p 'test_*.py' -v
```

No dependencies or live network required; all market prices and model
probabilities in tests are deliberately artificial.

## Next acceptance milestones

1. Restore the prior stable landing separately: GitHub main currently
   contains an accidental DoctoreAI merge and malformed `vercel.json`;
   the most recent Vercel production deployment was ERROR. This branch
   **does not** roll back, repair, deploy or merge production.
2. Written authorization for NBA data, odds redistribution and
   betting-model use. Revoke any previously exposed API key.
3. Signed/independently timestamped append-only quote/source receipts,
   real bookmaker execution probes (stake/line/price accepted),
   late tipoff-change handling and canonical market IDs.
4. Develop a model with licensed point-in-time features, a separately
   frozen test set, no future leakage, independent out-of-sample
   calibration and a no-vig market baseline.
5. Prospective paper record of all decisions, including passes,
   closing quotes, push outcomes, available betting limits, CLV,
   settled ROI and uncertainty bounds.

Keep BetDoctore's original frozen 363-game independent cohort separate.
Do not upload proprietary trained parameters or licensed source data to
this public GitHub repository. Consider a new **private repository**
once actual proprietary research begins.
