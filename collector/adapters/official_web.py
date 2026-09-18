"""Parser boundary for allowlisted official/public tourism records."""
def extract_records(payload:dict):
    for item in payload.get("items",[]):
        if not item.get("allowlisted",False): continue
        yield {"source_record_id":item.get("id"),"source_url":item.get("url"),"canonical_name":item.get("name"),"address":item.get("address"),"phone":item.get("phone"),"lat":item.get("lat"),"lng":item.get("lng"),"category":item.get("category"),"official":True}
