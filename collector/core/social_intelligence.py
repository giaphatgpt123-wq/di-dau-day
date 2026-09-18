from collections import defaultdict
from .trend import trend_velocity,trend_state
def aggregate(records:list[dict],window_recent_key="recent",window_baseline_key="baseline"):
    buckets=defaultdict(lambda:{"recent":0,"baseline":0,"sources":set()})
    for r in records:
        key=r.get("candidate_key"); 
        if not key: continue
        b=buckets[key]; b["recent"]+=int(r.get(window_recent_key,0)); b["baseline"]+=int(r.get(window_baseline_key,0)); b["sources"].add(r.get("source"))
    out=[]
    for key,b in buckets.items():
        v=trend_velocity(b["recent"],b["baseline"]); d=len({s for s in b["sources"] if s})
        out.append({"candidate_key":key,"mentions_recent":b["recent"],"mentions_baseline":b["baseline"],"source_diversity":d,"trend_velocity":v,"trend_state":trend_state(v,d)})
    return out
