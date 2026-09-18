INTERVAL_HOURS={"NEW":6,"HOT":6,"TRENDING":12,"VERIFIED":72,"STABLE":168,"STALE":24,"CLOSED":720}
def interval_hours(state:str)->int: return INTERVAL_HOURS.get(state,72)
def priority(state:str,uncertainty:float=0.0)->float:
    base={"NEW":1.0,"HOT":1.0,"TRENDING":.9,"STALE":.8,"VERIFIED":.4,"STABLE":.2,"CLOSED":.05}.get(state,.3)
    return round(min(1.0,base+.25*max(0,min(1,uncertainty))),3)
