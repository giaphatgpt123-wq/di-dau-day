import json
from pathlib import Path

EXPORT_FIELDS=("poi_id","canonical_name","aliases","category","lat","lng","address","province","locality","status","confidence_score","freshness_score")

def public_poi(poi: dict) -> dict:
    return {k:poi.get(k) for k in EXPORT_FIELDS}

def build_manifest(pois: list[dict], region: str, version: str) -> dict:
    return {"schema":"a1-poi-v1","region":region,"version":version,"count":len(pois)}

def export_package(pois: list[dict], region: str, version: str, output: str):
    verified=[public_poi(p) for p in pois if p.get("status")=="VERIFIED"]
    payload={"manifest":build_manifest(verified,region,version),"pois":verified}
    path=Path(output); path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
    return payload
