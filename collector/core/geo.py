from math import radians,sin,cos,sqrt,atan2
def distance_km(a_lat,a_lng,b_lat,b_lng):
    r=6371.0088; p1,p2=radians(a_lat),radians(b_lat); dp=radians(b_lat-a_lat); dl=radians(b_lng-a_lng)
    h=sin(dp/2)**2+cos(p1)*cos(p2)*sin(dl/2)**2
    return 2*r*atan2(sqrt(h),sqrt(1-h))
def geo_match(a,b,max_m=150):
    if None in (a.get("lat"),a.get("lng"),b.get("lat"),b.get("lng")): return False
    return distance_km(a["lat"],a["lng"],b["lat"],b["lng"])*1000<=max_m
