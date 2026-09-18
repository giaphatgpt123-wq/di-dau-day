import hashlib,json
def job_key(job:dict)->str:
    stable={k:job.get(k) for k in ("region","category","source","window")}
    raw=json.dumps(stable,sort_keys=True,separators=(",",":"))
    return hashlib.sha256(raw.encode()).hexdigest()[:24]
def should_run(key:str,completed:set[str],force:bool=False)->bool:
    return force or key not in completed
