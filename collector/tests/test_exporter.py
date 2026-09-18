import tempfile,unittest
from collector.core.exporter import export_package
from collector.api import LibraryAPI

class ExportTest(unittest.TestCase):
    def test_only_verified_exported(self):
        rows=[{"poi_id":"1","canonical_name":"A","category":"FOOD","status":"VERIFIED","confidence_score":.9,"freshness_score":1},{"poi_id":"2","canonical_name":"B","category":"FOOD","status":"CANDIDATE","confidence_score":.4,"freshness_score":1}]
        with tempfile.NamedTemporaryFile(suffix=".json") as f:
            p=export_package(rows,"KIEN_GIANG","2026.09",f.name)
            self.assertEqual(p["manifest"]["count"],1)
            api=LibraryAPI(f.name); self.assertEqual(len(api.search(category="FOOD")),1)

if __name__=="__main__": unittest.main()
