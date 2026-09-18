import unittest
from collector.core.query_generator import generate_queries
from collector.core.evidence import evidence_record, source_diversity
from collector.core.dedup import partition_candidates
from collector.core.trend import trend_state

class PipelineTest(unittest.TestCase):
    def test_query(self):
        self.assertTrue(any("Hà Tiên" in q for q in generate_queries("Hà Tiên","FOOD",2026)))
    def test_evidence_diversity(self):
        self.assertEqual(source_diversity([{"source_id":"a"},{"source_id":"b"},{"source_id":"a"}]),2)
    def test_dedup(self):
        r={"canonical_name":"Quán Ba","lat":10.1,"lng":104.1}
        groups,review=partition_candidates([r,dict(r)])
        self.assertEqual(len(groups),1); self.assertEqual(len(groups[0]),2)
    def test_trend(self):
        self.assertEqual(trend_state(1.2,3),"TRENDING")

if __name__=="__main__": unittest.main()
