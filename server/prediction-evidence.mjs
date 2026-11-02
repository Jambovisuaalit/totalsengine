/** Structural schema only. It does not verify an RFC3161 token or S3 Object Lock. */
export function inspectPredictionEvidence(record, fixture) {
  const fail = (reason) => ({ status: "BLOCKED", reason });
  if (!record || typeof record !== "object") return fail("MISSING_PREDICTION");
  if (!fixture?.scheduled_tipoff_utc || record.game_id !== fixture.provider_game_id)
    return fail("GAME_ID_MISMATCH");
  const timestamp = Date.parse(record.prediction_timestamp_utc);
  const cutoff = Date.parse(record.data_cutoff_utc);
  const tipoff = Date.parse(fixture.scheduled_tipoff_utc);
  if (![timestamp, cutoff, tipoff].every(Number.isFinite) || cutoff > timestamp || timestamp >= tipoff)
    return fail("INVALID_PREGAME_TIMESTAMPS");
  if (typeof record.model_version !== "string" || !record.model_version ||
      !Number.isFinite(record.predicted_total) || record.predicted_total < 100 || record.predicted_total > 400 ||
      !/^[a-f0-9]{64}$/i.test(record.artifact_sha256 || "") ||
      !/^[a-f0-9]{64}$/i.test(record.source_snapshot_sha256 || ""))
    return fail("MISSING_REPRODUCIBLE_ARTIFACT");
  return {
    status: "STRUCTURE_ONLY",
    reason: "Independent trusted timestamp, immutable archive and source provenance are not cryptographically verified.",
  };
}
