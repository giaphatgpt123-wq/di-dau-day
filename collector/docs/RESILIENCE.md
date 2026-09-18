# Resilience V1
Batch execution is idempotent by stable job keys. Checkpoints record completed/failed jobs. Dataset versions are content-addressed. Activation requires a passing quality gate. Manifests retain previous_version so the client or deployment layer can select a rollback target. Worker failures are isolated per job and do not abort unrelated batches.
