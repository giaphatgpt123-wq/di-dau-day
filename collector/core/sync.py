def changes_since(current: list[dict], known: dict[str,str]):
    changed=[]
    for poi in current:
        pid=poi.get("poi_id")
        version=str(poi.get("updated_at") or poi.get("freshness_score") or "")
        if known.get(pid)!=version:
            changed.append(poi)
    return changed
