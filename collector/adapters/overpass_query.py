TAG_FILTERS={
"FOOD":'["amenity"~"restaurant|fast_food|food_court"]',
"COFFEE":'["amenity"~"cafe"]',
"LODGING":'["tourism"~"hotel|guest_house|hostel|motel|resort"]',
"FUEL":'["amenity"="fuel"]',
"ATTRACTION":'["tourism"~"attraction|museum|viewpoint"]'
}
def build_around_query(lat:float,lng:float,radius_m:int,category:str)->str:
    tag=TAG_FILTERS[category]
    return f'[out:json][timeout:60];(nwr(around:{radius_m},{lat},{lng}){tag};);out center tags;'
