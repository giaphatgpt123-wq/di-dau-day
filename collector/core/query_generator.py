from itertools import product

DEFAULT_INTENTS = {
    "FOOD": ["ăn sáng", "ăn trưa", "ăn tối", "đặc sản", "quán local"],
    "COFFEE": ["cafe", "coffee view"],
    "LODGING": ["khách sạn", "nhà nghỉ", "villa", "resort"],
    "ATTRACTION": ["tham quan", "check-in", "điểm du lịch"],
}

def generate_queries(location: str, category: str, year: int | None = None):
    intents = DEFAULT_INTENTS.get(category, [])
    suffixes = ["", "mới", "được nhắc nhiều"]
    out=[]
    for intent,suffix in product(intents,suffixes):
        q=" ".join(x for x in [intent, location, suffix, str(year) if year else ""] if x)
        if q not in out: out.append(q)
    return out
