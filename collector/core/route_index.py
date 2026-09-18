from .geo import distance_km
def attach_route(poi:dict,route_points:list[tuple[float,float]],route_id:str,max_km:float=30):
    if poi.get("lat") is None or poi.get("lng") is None or not route_points: return poi
    nearest=min(distance_km(poi["lat"],poi["lng"],lat,lng) for lat,lng in route_points)
    out=dict(poi); out["route_id"]=route_id if nearest<=max_km else None; out["route_distance_km"]=round(nearest,2)
    return out
