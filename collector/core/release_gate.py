def evaluate(metrics:dict,minimum:dict|None=None):
    minimum=minimum or {"verified_pct":70.0,"geo_pct":95.0}
    failures=[f"{k}<{v}" for k,v in minimum.items() if float(metrics.get(k,0))<float(v)]
    return {"pass":not failures,"failures":failures}
