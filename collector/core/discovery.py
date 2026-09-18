from .query_generator import generate_queries
def discovery_plan(region:dict):
    rows=[]
    for category in region.get("categories",[]):
        for q in generate_queries(region["name"],category,region.get("query_year")):
            rows.append({"region_id":region["region_id"],"category":category,"query":q,"state":"PENDING"})
    return rows
def prioritize(rows:list[dict],hot_terms:set[str]|None=None):
    hot_terms=hot_terms or set()
    for r in rows:r["priority"]=100 if any(t.casefold() in r["query"].casefold() for t in hot_terms) else 50
    return sorted(rows,key=lambda r:-r["priority"])
