from .entity_resolution import entity_decision

def partition_candidates(records: list[dict]):
    groups=[]
    review=[]
    for record in records:
        placed=False
        for group in groups:
            decision=entity_decision(group[0],record)
            if decision=="MERGE":
                group.append(record); placed=True; break
            if decision=="REVIEW":
                review.append((group[0],record)); placed=True; break
        if not placed: groups.append([record])
    return groups,review
