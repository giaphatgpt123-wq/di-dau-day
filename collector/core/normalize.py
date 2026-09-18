import re
import unicodedata

def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKC", value or "").strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value

def canonical_key(name: str, locality: str = "") -> str:
    return f"{normalize_text(name)}|{normalize_text(locality)}"
