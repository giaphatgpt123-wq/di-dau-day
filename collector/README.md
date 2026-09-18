# A1 Travel Intelligence Collector (A1-TIC) V1

Pipeline: source adapters -> raw evidence -> normalize -> entity resolution/dedup -> verification -> scoring -> staging -> A1 export.

V1 starts with OpenStreetMap/Overpass as a seed source. Social sources must use public/authorized APIs, feeds or permitted pages and must respect source terms/rate limits.

## Data states
RAW_SOURCE -> EVIDENCE -> POI_CANDIDATE -> VERIFIED_POI -> A1_EXPORT

## Run
python collector/run.py --input collector/examples/osm_sample.json --output data/a1-tic-poi.json
