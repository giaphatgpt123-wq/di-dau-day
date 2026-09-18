from .idempotency import job_key,should_run
def execute(jobs:list[dict],handler,completed:set[str]|None=None):
    completed=completed or set(); results=[]
    for job in jobs:
        key=job_key(job)
        if not should_run(key,completed): results.append({"key":key,"state":"SKIPPED"}); continue
        try: results.append({"key":key,"state":"DONE","result":handler(job)})
        except Exception as e: results.append({"key":key,"state":"FAILED","error":type(e).__name__})
    return results
