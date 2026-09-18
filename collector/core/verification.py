from .evidence import source_diversity
def verify(candidate:dict,evidence:list[dict],min_confidence=.75):
    diversity=source_diversity(evidence)
    geo= candidate.get("lat") is not None and candidate.get("lng") is not None
    score=min(1.0,.25+.15*min(diversity,3)+(.20 if geo else 0)+.10*min(len(evidence),2))
    conflicts=bool(candidate.get("conflicts"))
    state="CONFLICT" if conflicts else ("VERIFIED" if score>=min_confidence else "CANDIDATE")
    return {"status":state,"confidence_score":round(score,3),"source_diversity":diversity}
