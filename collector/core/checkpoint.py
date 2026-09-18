import json
from pathlib import Path
def load(path:str)->dict:
    p=Path(path); return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {"completed":[],"failed":[]}
def save(path:str,state:dict):
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(state,ensure_ascii=False,indent=2),encoding="utf-8")
def mark(state:dict,job_id:str,ok:bool):
    key="completed" if ok else "failed"; other="failed" if ok else "completed"
    if job_id not in state[key]: state[key].append(job_id)
    state[other]=[x for x in state[other] if x!=job_id]; return state
