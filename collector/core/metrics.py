def pipeline_metrics(records:list[dict])->dict:
    total=len(records); verified=sum(r.get("status")=="VERIFIED" for r in records); conflict=sum(r.get("status")=="CONFLICT" for r in records); geo=sum(r.get("lat") is not None and r.get("lng") is not None for r in records)
    pct=lambda n:round(100*n/total,2) if total else 0.0
    return {"total":total,"verified":verified,"verified_pct":pct(verified),"conflict":conflict,"geo_pct":pct(geo)}
