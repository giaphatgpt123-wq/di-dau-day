import unittest
from collector.adapters.overpass_query import build_around_query
from collector.core.geo import distance_km
from collector.core.verification import verify
from collector.core.quality_gate import publishable
class PilotTest(unittest.TestCase):
 def test_query(self): self.assertIn('amenity',build_around_query(10.38,104.49,30000,"FOOD"))
 def test_distance(self): self.assertLess(distance_km(10.38,104.49,10.381,104.491),1)
 def test_verify(self):
  p={"lat":10.38,"lng":104.49}; ev=[{"source_id":"osm"},{"source_id":"official"}]
  v=verify(p,ev); self.assertEqual(v["status"],"VERIFIED")
 def test_gate(self):
  ok,_=publishable({"status":"VERIFIED","confidence_score":.9,"lat":1,"lng":1},{"min_confidence":.75,"require_geo":True}); self.assertTrue(ok)
if __name__=="__main__": unittest.main()
