from urllib.parse import quote
def navigation_handoff(poi:dict)->dict:
    lat,lng=poi.get("lat"),poi.get("lng")
    if lat is None or lng is None:return {"available":False}
    label=quote(poi.get("canonical_name") or "Điểm đến")
    return {"available":True,"destination":{"lat":lat,"lng":lng},"google_maps":f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}","geo_uri":f"geo:{lat},{lng}?q={lat},{lng}({label})"}
