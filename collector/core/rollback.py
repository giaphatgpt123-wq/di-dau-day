def rollback_target(history:list[dict],current_version:str)->str|None:
    by_version={h.get("version"):h for h in history}
    current=by_version.get(current_version)
    return current.get("previous_version") if current else None
def can_activate(manifest:dict,gate:dict)->bool:
    return bool(gate.get("pass")) and int(manifest.get("count",0))>=0 and bool(manifest.get("version"))
