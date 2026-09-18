def provenance_summary(evidence:list[dict])->dict:
    sources=sorted({e.get("source_id") or e.get("source") for e in evidence if e.get("source_id") or e.get("source")})
    urls=sorted({e.get("source_url") or e.get("url") for e in evidence if e.get("source_url") or e.get("url")})
    return {"source_count":len(sources),"sources":sources,"source_urls":urls}
