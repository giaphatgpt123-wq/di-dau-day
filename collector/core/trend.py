def trend_velocity(recent_mentions: int, baseline_mentions: int) -> float:
    base=max(baseline_mentions,1)
    return round((recent_mentions-baseline_mentions)/base,3)

def trend_state(velocity: float, source_diversity: int) -> str:
    if source_diversity < 2: return "UNCONFIRMED"
    if velocity >= 1.0: return "TRENDING"
    if velocity >= 0.25: return "EMERGING"
    if velocity <= -0.5: return "DECLINING"
    return "STABLE"
