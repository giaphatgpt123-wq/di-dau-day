def fingerprint(record:dict)->tuple:
    return tuple(record.get(k) for k in ("canonical_name","category","lat","lng","address","phone","website"))
def diff(previous:list[dict],current:list[dict]):
    old={p["poi_id"]:p for p in previous}; new={p["poi_id"]:p for p in current}
    added=[p for k,p in new.items() if k not in old]
    changed=[p for k,p in new.items() if k in old and fingerprint(p)!=fingerprint(old[k])]
    missing=[p for k,p in old.items() if k not in new]
    return {"added":added,"changed":changed,"missing":missing}
