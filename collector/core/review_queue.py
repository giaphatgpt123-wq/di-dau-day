SEVERITY={"LOCATION_CONFLICT":100,"DUPLICATE_SUSPECTED":80,"SOURCE_CONFLICT":70,"LOW_CONFIDENCE":60,"STALE":40}
def build_review_item(poi:dict,reasons:list[str])->dict:
    reason=max(reasons,key=lambda r:SEVERITY.get(r,10)) if reasons else "UNKNOWN"
    return {"poi_id":poi.get("poi_id"),"reason":reason,"reasons":reasons,"priority":SEVERITY.get(reason,10),"name":poi.get("canonical_name")}
def sort_queue(items:list[dict])->list[dict]:
    return sorted(items,key=lambda x:(-x.get("priority",0),x.get("poi_id") or ""))
