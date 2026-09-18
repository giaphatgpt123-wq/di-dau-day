def make_batches(regions:list[str],categories:list[str],batch_size:int=10):
    jobs=[{"region":r,"category":c,"state":"PENDING","attempts":0} for r in regions for c in categories]
    return [jobs[i:i+batch_size] for i in range(0,len(jobs),batch_size)]
def retryable(job:dict,max_retries:int=3)->bool:
    return job.get("state")=="FAILED" and int(job.get("attempts",0))<max_retries
