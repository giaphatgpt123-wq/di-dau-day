def health(last_ok:bool,failure_count:int)->str:
    if last_ok and failure_count==0:return "HEALTHY"
    if failure_count>=5:return "DISABLED_REVIEW"
    if failure_count>=2:return "DEGRADED"
    return "RETRY"
