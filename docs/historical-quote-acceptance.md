# Historical quote acceptance gates (research only)

- **CI:** run `python -m unittest discover -s tests_nba_totals -p 'test_*.py' -v`. No production signal release.
- **Licensed data:** `Rights` is currently caller-supplied; it is NOT an independently authenticated license registry. Real historical data cannot be certified licensed by this code alone.
- **Game identity:** `GameMapping` binds source_game_id to canonical game UUID with evidence hash and verification time. Its claims are local until independent source review.
- **Point-in-time:** `SourceAvailability` enforces availability <= assessment time and >= provider publication time; other model features require their own availability checks.
- **Evidence chain:** `bind_assessment` requires exact quote/assessment equality, emits content-addressed local evidence reference and always sets `training_eligible=false`, `publication_allowed=false`, `gate_status=NO_GO`.
- **Missing before approval:** actual licensed provider data, independently checked mapping evidence, verified point-in-time feature snapshots, and successful latest-SHA CI.
