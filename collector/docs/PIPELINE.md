# A1-TIC operational pipeline

1. Discover: query generator creates locality/category intents.
2. Collect: authorized/public source adapters emit raw records.
3. Evidence: raw payloads are hashed and retained with provenance.
4. Resolve: normalize, georesolve, deduplicate and entity-match.
5. Verify: independent evidence and conflicts determine state.
6. Score: confidence/freshness/trend remain separate dimensions.
7. Publish: only VERIFIED POIs enter A1 export packages.
8. Sync: A1 clients consume manifest/package; raw evidence never ships to mobile.

## Safety and source policy
No adapter may bypass login, CAPTCHA, access controls or platform rate limits. Social collection requires an authorized API/feed or permitted public input.
