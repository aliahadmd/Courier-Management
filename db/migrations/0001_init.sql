-- Couriers table stores operational details and live metrics per courier/driver
CREATE TABLE IF NOT EXISTS couriers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  vehicle TEXT,
  region TEXT,
  status TEXT CHECK (status IN ('online', 'offline', 'break')) NOT NULL DEFAULT 'offline',
  last_seen TEXT,
  location_lat REAL,
  location_lng REAL,
  speed_kmh REAL DEFAULT 0,
  on_time_rate REAL DEFAULT 0,
  deliveries_today INTEGER DEFAULT 0,
  distance_today_km REAL DEFAULT 0,
  eta_variance_minutes REAL DEFAULT 0,
  rating REAL DEFAULT 0
);

-- Customers table keeps contact details and delivery preferences
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  notes TEXT
);

-- Shipments represent parcel lifecycle and assignment
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  tracking_id TEXT UNIQUE NOT NULL,
  order_number TEXT,
  customer_id TEXT NOT NULL,
  courier_id TEXT,
  status TEXT CHECK (status IN ('pending', 'in_transit', 'delayed', 'delivered')) NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pickup_scheduled_at TEXT,
  picked_up_at TEXT,
  delivered_at TEXT,
  eta_minutes INTEGER DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  weight_kg REAL,
  service_level TEXT CHECK (service_level IN ('same_day', 'next_day', 'standard')) DEFAULT 'standard',
  region TEXT,
  origin TEXT,
  destination TEXT,
  proof_asset_key TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL
);

-- Shipment events track timeline/status history for auditability
CREATE TABLE IF NOT EXISTS shipment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id TEXT NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type TEXT CHECK (type IN ('status', 'handoff', 'alert')) NOT NULL DEFAULT 'status',
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Waypoints describe route visualization metadata
CREATE TABLE IF NOT EXISTS shipment_waypoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  label TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- Indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_courier ON shipments(courier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_events_shipment ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON shipment_events(timestamp DESC);
