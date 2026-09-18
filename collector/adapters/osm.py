CATEGORY_MAP={"restaurant":"FOOD","cafe":"COFFEE","hotel":"LODGING","guest_house":"LODGING","fuel":"FUEL","attraction":"ATTRACTION"}

def extract_elements(payload: dict):
    for e in payload.get("elements", []):
        tags=e.get("tags",{})
        name=tags.get("name")
        if not name: continue
        raw_type=tags.get("amenity") or tags.get("tourism")
        category=CATEGORY_MAP.get(raw_type)
        if not category: continue
        center=e.get("center",{})
        yield {"source_record_id":f"osm:{e.get('type')}:{e.get('id')}","canonical_name":name,"category":category,"lat":e.get("lat",center.get("lat")),"lng":e.get("lon",center.get("lon")),"address":tags.get("addr:full"),"locality":tags.get("addr:city") or tags.get("addr:district"),"source_url":f"https://www.openstreetmap.org/{e.get('type')}/{e.get('id')}"}
