def confidence(evidence_count: int, source_diversity: int, geo_known: bool) -> float:
    score = 0.25 + min(evidence_count, 4) * 0.10 + min(source_diversity, 3) * 0.10 + (0.15 if geo_known else 0)
    return round(min(score, 1.0), 3)

def publish_state(score: float, conflict: bool = False) -> str:
    if conflict: return "CONFLICT"
    return "VERIFIED" if score >= 0.75 else "CANDIDATE"
