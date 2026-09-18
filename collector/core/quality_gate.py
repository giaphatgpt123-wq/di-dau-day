def publishable(poi:dict,policy:dict)->tuple[bool,list[str]]:
    reasons=[]
    if poi.get("status")!="VERIFIED": reasons.append("NOT_VERIFIED")
    if float(poi.get("confidence_score",0))<float(policy.get("min_confidence",.75)): reasons.append("LOW_CONFIDENCE")
    if policy.get("require_geo",True) and (poi.get("lat") is None or poi.get("lng") is None): reasons.append("NO_GEO")
    return (not reasons,reasons)
