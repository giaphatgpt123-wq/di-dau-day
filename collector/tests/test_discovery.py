import unittest
from collector.core.discovery import discovery_plan
from collector.core.social_intelligence import aggregate
from collector.adapters.official_web import extract_records
class DiscoveryTest(unittest.TestCase):
 def test_plan(self):
  r={"region_id":"R","name":"Hà Tiên","categories":["FOOD"],"query_year":2026}; self.assertGreater(len(discovery_plan(r)),2)
 def test_social_needs_diversity(self):
  x=aggregate([{"candidate_key":"a","recent":10,"baseline":2,"source":"youtube"}]); self.assertEqual(x[0]["trend_state"],"UNCONFIRMED")
 def test_allowlist(self):
  x=list(extract_records({"items":[{"id":"1","name":"A","allowlisted":False},{"id":"2","name":"B","allowlisted":True}]})); self.assertEqual(len(x),1)
if __name__=="__main__": unittest.main()
