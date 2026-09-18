# A1-TIC Operations V1

Operational rules:
- Incremental collection compares canonical POI fingerprints; disappearance becomes a recheck signal, never immediate deletion.
- Review queue prioritizes location conflicts, duplicate suspicion, source conflicts, low confidence and stale records.
- Source health degrades and enters review after repeated failures.
- Route index attaches verified POIs to route corridors for A1 travel queries.
- Automated publication remains behind the quality gate.
