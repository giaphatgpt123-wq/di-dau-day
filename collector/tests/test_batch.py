import unittest
from collector.core.batch import make_batches,retryable
from collector.core.metrics import pipeline_metrics
from collector.core.release_gate import evaluate
class BatchTest(unittest.TestCase):
 def test_batches(self): self.assertEqual(len(make_batches(["A","B"],["FOOD","FUEL"],3)),2)
 def test_retry(self): self.assertTrue(retryable({"state":"FAILED","attempts":2},3))
 def test_gate(self):
  m=pipeline_metrics([{"status":"VERIFIED","lat":1,"lng":1}]*8+[{"status":"CANDIDATE","lat":1,"lng":1}]*2); self.assertTrue(evaluate(m)["pass"])
if __name__=="__main__": unittest.main()
