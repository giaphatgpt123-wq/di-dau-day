import argparse,json,hashlib
from pathlib import Path
from adapters.osm import extract_elements
from core.scoring import confidence,publish_state

def build_poi(r):
    evidence={"source":"osm_overpass","record_id":r["source_record_id"],"url":r["source_url"]}
    score=confidence(1,1,r.get("lat") is not None)
    pid="A1-"+hashlib.sha1((r["source_record_id"]).encode()).hexdigest()[:12].upper()
    return {"poi_id":pid,"canonical_name":r["canonical_name"],"aliases":[],"category":r["category"],"lat":r.get("lat"),"lng":r.get("lng"),"address":r.get("address"),"province":None,"locality":r.get("locality"),"status":publish_state(score),"confidence_score":score,"freshness_score":1.0,"evidence":[evidence]}

def main():
    p=argparse.ArgumentParser(); p.add_argument("--input",required=True); p.add_argument("--output",required=True); a=p.parse_args()
    payload=json.loads(Path(a.input).read_text(encoding="utf-8"))
    out=[build_poi(x) for x in extract_elements(payload)]
    Path(a.output).parent.mkdir(parents=True,exist_ok=True); Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"A1-TIC: exported {len(out)} POIs")

if __name__=="__main__": main()
