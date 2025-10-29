-- Additional structures for dispatch tooling and proof-of-delivery enhancements

CREATE TABLE IF NOT EXISTS sla_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  service_level TEXT NOT NULL,
  target_minutes INTEGER NOT NULL,
  cutoff_hour INTEGER DEFAULT 17,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispatch_rules (
  id TEXT PRIMARY KEY,
  region TEXT,
  vehicle_type TEXT,
  max_active_shipments INTEGER DEFAULT 0,
  enable_auto_assign INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_proofs (
  id TEXT PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  asset_key TEXT NOT NULL,
  kind TEXT CHECK (kind IN ('photo','signature','document')) NOT NULL DEFAULT 'photo',
  uploaded_by TEXT,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id TEXT PRIMARY KEY,
  filename TEXT,
  status TEXT CHECK (status IN ('pending','processing','completed','failed')) NOT NULL DEFAULT 'pending',
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  error_details TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_dispatch_rules_region ON dispatch_rules(region);
CREATE INDEX IF NOT EXISTS idx_shipment_proofs_shipment ON shipment_proofs(shipment_id);

ALTER TABLE shipments ADD COLUMN sla_policy_id TEXT;
CREATE INDEX IF NOT EXISTS idx_shipments_sla_policy ON shipments(sla_policy_id);
