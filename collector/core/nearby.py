from .geo import distance_km
def nearby(pois:list[dict],lat:float,lng:float,radius_km:float=20,category:str|None=None):
    out=[]
    for p in pois:
        if p.get("status")!="VERIFIED" or p.get("lat") is None or p.get("lng") is None: continue
        if category and p.get("category")!=category: continue
        d=distance_km(lat,lng,p["lat"],p["lng"])
        if d<=radius_km:
            q=dict(p); q["distance_km"]=round(d,2); out.append(q)
    return sorted(out,key=lambda x:x["distance_km"])
