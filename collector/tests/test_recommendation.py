import unittest
from collector.core.nearby import nearby
from collector.core.ranking import ranked
from collector.core.place_card import build_card
class RecommendationTest(unittest.TestCase):
 def test_flow(self):
  pois=[{"poi_id":"1","canonical_name":"A","category":"FOOD","status":"VERIFIED","lat":10.38,"lng":104.49,"confidence_score":.9,"freshness_score":.9,"quality_score":.8}]
  rows=ranked(nearby(pois,10.381,104.491,20,"FOOD")); self.assertEqual(len(rows),1)
  card=build_card(rows[0]); self.assertTrue(card["navigation"]["available"]); self.assertTrue(card["reasons"])
 def test_candidate_hidden(self):
  self.assertEqual(nearby([{"status":"CANDIDATE","lat":1,"lng":1}],1,1),[])
if __name__=="__main__": unittest.main()
