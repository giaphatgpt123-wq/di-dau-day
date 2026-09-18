def explain(poi:dict)->list[str]:
    reasons=[]
    if poi.get("distance_km") is not None and poi["distance_km"]<=5: reasons.append("Gần vị trí hiện tại")
    if float(poi.get("confidence_score",0))>=.85: reasons.append("Thông tin được xác minh tốt")
    if float(poi.get("freshness_score",0))>=.8: reasons.append("Dữ liệu còn mới")
    if float(poi.get("quality_score",0))>=.8: reasons.append("Có tín hiệu chất lượng tốt")
    if poi.get("trend_state") in ("TRENDING","EMERGING"): reasons.append("Đang được quan tâm")
    return reasons[:3] or ["Phù hợp bộ lọc hiện tại"]
