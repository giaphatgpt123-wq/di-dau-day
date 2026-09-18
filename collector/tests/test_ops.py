import unittest
from collector.core.review_queue import build_review_item
from collector.core.incremental import diff
from collector.core.route_index import attach_route
from collector.core.source_health import health
class OpsTest(unittest.TestCase):
 def test_review(self): self.assertEqual(build_review_item({"poi_id":"1"},["LOW_CONFIDENCE","LOCATION_CONFLICT"])["reason"],"LOCATION_CONFLICT")
 def test_diff(self):
  a=[{"poi_id":"1","canonical_name":"A"}]; b=[{"poi_id":"1","canonical_name":"B"},{"poi_id":"2","canonical_name":"C"}]
  d=diff(a,b); self.assertEqual(len(d["added"]),1); self.assertEqual(len(d["changed"]),1)
 def test_route(self): self.assertEqual(attach_route({"lat":10,"lng":104},[(10,104)],"R1")["route_id"],"R1")
 def test_health(self): self.assertEqual(health(False,5),"DISABLED_REVIEW")
if __name__=="__main__": unittest.main()
