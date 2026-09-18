import json
from pathlib import Path

class LibraryAPI:
    def __init__(self, package_path: str):
        self.package=json.loads(Path(package_path).read_text(encoding="utf-8"))

    def manifest(self):
        return self.package["manifest"]

    def search(self, category=None, locality=None):
        rows=self.package["pois"]
        if category: rows=[p for p in rows if p.get("category")==category]
        if locality: rows=[p for p in rows if (p.get("locality") or "").casefold()==locality.casefold()]
        return rows
