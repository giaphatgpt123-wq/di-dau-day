from .explain import explain
from .navigation import navigation_handoff
def build_card(poi:dict)->dict:
    return {"id":poi.get("poi_id"),"name":poi.get("canonical_name"),"category":poi.get("category"),"distance_km":poi.get("distance_km"),"rank_score":poi.get("rank_score"),"reasons":explain(poi),"address":poi.get("address"),"coordinates":{"lat":poi.get("lat"),"lng":poi.get("lng")},"navigation":navigation_handoff(poi),"verified":poi.get("status")=="VERIFIED"}
