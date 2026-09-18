CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS source_registry (
  source_id text PRIMARY KEY, source_name text NOT NULL, source_type text NOT NULL,
  adapter text NOT NULL, enabled boolean NOT NULL DEFAULT true, priority int NOT NULL DEFAULT 50,
  trust_weight numeric(4,3) NOT NULL DEFAULT .500, rate_limit text, crawl_interval interval,
  last_success timestamptz, last_failure timestamptz, failure_count int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS raw_document (
  id bigserial PRIMARY KEY, source_id text REFERENCES source_registry(source_id),
  source_record_id text NOT NULL, source_url text, captured_at timestamptz NOT NULL DEFAULT now(),
  content_hash text NOT NULL, payload jsonb NOT NULL,
  UNIQUE(source_id, source_record_id, content_hash)
);

CREATE TABLE IF NOT EXISTS poi (
  id uuid PRIMARY KEY, canonical_name text NOT NULL, category text NOT NULL,
  geom geography(Point,4326), address text, province text, locality text, phone text, website text,
  status text NOT NULL CHECK(status IN ('CANDIDATE','VERIFIED','CONFLICT','STALE','CLOSED')),
  confidence_score numeric(4,3) NOT NULL DEFAULT 0, freshness_score numeric(4,3) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS poi_geom_gix ON poi USING GIST(geom);

CREATE TABLE IF NOT EXISTS poi_alias (
  poi_id uuid REFERENCES poi(id) ON DELETE CASCADE, alias text NOT NULL, normalized_alias text NOT NULL,
  PRIMARY KEY(poi_id, normalized_alias)
);

CREATE TABLE IF NOT EXISTS evidence (
  id bigserial PRIMARY KEY, poi_id uuid REFERENCES poi(id) ON DELETE SET NULL,
  raw_document_id bigint REFERENCES raw_document(id) ON DELETE SET NULL,
  evidence_type text NOT NULL, source_url text, captured_at timestamptz NOT NULL DEFAULT now(),
  confidence numeric(4,3) NOT NULL DEFAULT 0, facts jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS poi_signal (
  id bigserial PRIMARY KEY, poi_id uuid REFERENCES poi(id) ON DELETE CASCADE,
  signal_type text NOT NULL, signal_value numeric NOT NULL, source_count int NOT NULL DEFAULT 1,
  observed_at timestamptz NOT NULL DEFAULT now()
);
