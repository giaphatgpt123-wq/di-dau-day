def rank_score(poi:dict,weights:dict|None=None)->float:
    w=weights or {"confidence":.35,"freshness":.20,"quality":.20,"trend":.10,"distance":.15}
    distance_factor=max(0,1-min(float(poi.get("distance_km",20)),20)/20)
    vals={"confidence":float(poi.get("confidence_score",0)),"freshness":float(poi.get("freshness_score",0)),"quality":float(poi.get("quality_score",.5)),"trend":float(poi.get("trend_score",0)),"distance":distance_factor}
    return round(sum(w[k]*vals[k] for k in w),4)
def ranked(pois:list[dict]):
    out=[]
    for p in pois:
        q=dict(p);q["rank_score"]=rank_score(q);out.append(q)
    return sorted(out,key=lambda x:(-x["rank_score"],x.get("distance_km",999)))
