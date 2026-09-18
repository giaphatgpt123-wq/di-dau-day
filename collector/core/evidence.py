import hashlib, json

def content_hash(payload) -> str:
    raw=json.dumps(payload,ensure_ascii=False,sort_keys=True,separators=(",",":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def evidence_record(source_id: str, source_record_id: str, source_url: str | None, facts: dict):
    return {
        "source_id":source_id,
        "source_record_id":source_record_id,
        "source_url":source_url,
        "content_hash":content_hash(facts),
        "facts":facts,
    }

def source_diversity(evidence: list[dict]) -> int:
    return len({e.get("source_id") or e.get("source") for e in evidence if e.get("source_id") or e.get("source")})
