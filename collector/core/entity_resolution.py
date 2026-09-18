from difflib import SequenceMatcher
from .normalize import normalize_text

def name_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_text(a), normalize_text(b)).ratio()

def entity_decision(a: dict, b: dict) -> str:
    name = name_similarity(a.get("canonical_name",""), b.get("canonical_name",""))
    geo = 1.0 if a.get("lat") == b.get("lat") and a.get("lng") == b.get("lng") and a.get("lat") is not None else 0.0
    score = 0.7 * name + 0.3 * geo
    if score >= 0.90: return "MERGE"
    if score >= 0.72: return "REVIEW"
    return "NEW"
