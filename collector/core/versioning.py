import hashlib,json
def dataset_version(records:list[dict],prefix="a1"):
    raw=json.dumps(sorted(records,key=lambda x:x.get("poi_id","")),ensure_ascii=False,sort_keys=True,separators=(",",":"))
    return f"{prefix}-{hashlib.sha256(raw.encode()).hexdigest()[:12]}"
def manifest(records:list[dict],region:str,previous_version:str|None=None):
    version=dataset_version(records)
    return {"schema":"a1-poi-v1","region":region,"version":version,"previous_version":previous_version,"count":len(records)}
