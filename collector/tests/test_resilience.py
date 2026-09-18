import unittest
from collector.core.idempotency import job_key,should_run
from collector.core.versioning import manifest
from collector.core.rollback import rollback_target,can_activate
from collector.core.worker import execute
class ResilienceTest(unittest.TestCase):
 def test_idempotent(self):
  j={"region":"A","category":"FOOD","source":"osm","window":"2026-09"}; k=job_key(j); self.assertFalse(should_run(k,{k}))
 def test_version_rollback(self):
  m=manifest([{"poi_id":"1"}],"R","old"); self.assertTrue(can_activate(m,{"pass":True})); self.assertEqual(rollback_target([m],m["version"]),"old")
 def test_worker_failure_isolated(self):
  r=execute([{"region":"A","category":"X"},{"region":"B","category":"Y"}],lambda j: 1/0 if j["region"]=="A" else 1); self.assertEqual([x["state"] for x in r],["FAILED","DONE"])
if __name__=="__main__": unittest.main()
