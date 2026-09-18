import unittest
from collector.core.normalize import normalize_text
from collector.core.entity_resolution import entity_decision
from collector.core.scoring import confidence

class CoreTest(unittest.TestCase):
    def test_normalize(self): self.assertEqual(normalize_text("  Quán   Ba "), "quán ba")
    def test_merge_exact_geo(self):
        a={"canonical_name":"Quán Ba","lat":10.1,"lng":104.1}; b={"canonical_name":"quán ba","lat":10.1,"lng":104.1}
        self.assertEqual(entity_decision(a,b),"MERGE")
    def test_score_bounds(self): self.assertLessEqual(confidence(99,99,True),1.0)

if __name__=="__main__": unittest.main()
