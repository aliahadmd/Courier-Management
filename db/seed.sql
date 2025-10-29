-- Sample dataset to bootstrap the Courier dashboard demo environment.
-- Run with:
--   wrangler d1 execute COURIER_DB --file=db/seed.sql

DELETE FROM shipment_proofs;
DELETE FROM shipment_waypoints;
DELETE FROM shipment_events;
DELETE FROM shipments;
DELETE FROM dispatch_rules;
DELETE FROM sla_policies;
DELETE FROM bulk_import_jobs;
DELETE FROM couriers;
DELETE FROM customers;

INSERT INTO customers (id, name, email, phone, address, city, region, notes) VALUES
  ('cust-001', 'Priya Patel', 'priya.patel@example.com', '+1 (312) 555-0147', '45 Market Street', 'Chicago', 'Central', 'Prefers evening deliveries after 6 PM.'),
  ('cust-002', 'Liam Chen', 'liam.chen@example.com', '+1 (415) 555-2099', '88 Mission Blvd', 'San Francisco', 'West', NULL),
  ('cust-003', 'Sara Ibrahim', 'sara.ibrahim@example.com', '+1 (646) 555-3310', '77 Hudson Yard', 'New York', 'East', 'Office tower requires dock access code.'),
  ('cust-004', 'Miguel Torres', 'miguel.torres@example.com', '+1 (786) 555-7832', '19 Biscayne Ave', 'Miami', 'South', NULL);

INSERT INTO couriers (
  id, name, avatar, phone, vehicle, region, status, last_seen, location_lat, location_lng,
  speed_kmh, on_time_rate, deliveries_today, distance_today_km, eta_variance_minutes, rating
) VALUES
  ('courier-001', 'Jordan Reed', NULL, '+1 (312) 555-8801', 'E-Van • Ford Transit', 'Central', 'online', datetime('now','-2 minutes'), 41.887, -87.635, 42, 0.96, 18, 122, -4, 4.9),
  ('courier-002', 'Amelia Brooks', NULL, '+1 (415) 555-4410', 'Cargo Bike • Urban Arrow XL', 'West', 'online', datetime('now','-5 minutes'), 37.79, -122.4, 21, 0.99, 12, 48, 2, 4.8),
  ('courier-003', 'Diego Martínez', NULL, '+1 (646) 555-8822', 'Compact Van • Nissan NV200', 'East', 'break', datetime('now','-9 minutes'), 40.75, -73.995, 0, 0.91, 16, 98, 8, 4.6),
  ('courier-004', 'Fatima Al-Hassan', NULL, '+1 (786) 555-6621', 'Scooter • NIU NQi Sport', 'South', 'online', datetime('now','-1 minutes'), 25.775, -80.2, 34, 0.94, 14, 76, -2, 4.7);

INSERT INTO shipments (
  id, tracking_id, order_number, customer_id, courier_id, status,
  created_at, pickup_scheduled_at, picked_up_at, delivered_at,
  eta_minutes, weight_kg, service_level, region,
  origin, destination, proof_asset_key
) VALUES
  ('ship-001', 'TRK-641823', 'ORD-8745', 'cust-001', 'courier-001', 'in_transit',
    datetime('now','-6 hours'), datetime('now','-5 hours'), datetime('now','-4 hours 50 minutes'), NULL,
    35, 3.2, 'same_day', 'Central',
    'Fulfillment Hub • West Loop', '45 Market Street, Chicago', NULL),
  ('ship-002', 'TRK-428190', 'ORD-5190', 'cust-002', 'courier-002', 'delivered',
    datetime('now','-9 hours'), datetime('now','-8 hours'), datetime('now','-7 hours 55 minutes'), datetime('now','-20 minutes'),
    0, 1.1, 'same_day', 'West',
    'Micro Hub • SoMa', '88 Mission Blvd, San Francisco', NULL),
  ('ship-003', 'TRK-917632', 'ORD-6540', 'cust-003', 'courier-003', 'delayed',
    datetime('now','-13 hours'), datetime('now','-10 hours'), datetime('now','-9 hours 50 minutes'), NULL,
    90, 5.4, 'next_day', 'East',
    'Regional Depot • Newark', '77 Hudson Yard, New York', NULL),
  ('ship-004', 'TRK-812673', 'ORD-1024', 'cust-003', 'courier-003', 'pending',
    datetime('now','-90 minutes'), datetime('now','+30 minutes'), NULL, NULL,
    210, 2.4, 'standard', 'East',
    'Fulfillment Center • Queens', '77 Hudson Yard, New York', NULL),
  ('ship-005', 'TRK-238761', 'ORD-8842', 'cust-004', 'courier-004', 'in_transit',
    datetime('now','-7 hours'), datetime('now','-6 hours'), datetime('now','-5 hours 55 minutes'), NULL,
    25, 0.9, 'same_day', 'South',
    'Warehouse • Coral Gables', '19 Biscayne Ave, Miami', NULL),
  ('ship-006', 'TRK-554712', 'ORD-9961', 'cust-001', 'courier-001', 'delivered',
    datetime('now','-15 hours'), datetime('now','-14 hours'), datetime('now','-13 hours 50 minutes'), datetime('now','-3 hours 30 minutes'),
    0, 6.2, 'standard', 'Central',
    'Regional Hub • Joliet', '45 Market Street, Chicago', NULL),
  ('ship-007', 'TRK-663782', 'ORD-1144', 'cust-004', 'courier-004', 'pending',
    datetime('now','-65 minutes'), datetime('now','+10 minutes'), NULL, NULL,
    140, 4.1, 'standard', 'South',
    'Warehouse • Doral', '19 Biscayne Ave, Miami', NULL),
  ('ship-008', 'TRK-227341', 'ORD-7052', 'cust-003', 'courier-003', 'in_transit',
    datetime('now','-9 hours'), datetime('now','-7 hours 30 minutes'), datetime('now','-7 hours 25 minutes'), NULL,
    55, 2.7, 'next_day', 'East',
    'Cross-dock • Brooklyn', '77 Hudson Yard, New York', NULL);

INSERT INTO sla_policies (id, name, region, service_level, target_minutes, cutoff_hour) VALUES
  ('sla-central-same-day', 'Central Same-day', 'Central', 'same_day', 180, 16),
  ('sla-east-next-day', 'East Next-day', 'East', 'next_day', 720, 18),
  ('sla-standard', 'Standard Nationwide', NULL, 'standard', 1440, 17);

INSERT INTO dispatch_rules (id, region, vehicle_type, max_active_shipments, enable_auto_assign, priority) VALUES
  ('rule-central-van', 'Central', 'E-Van • Ford Transit', 12, 1, 10),
  ('rule-east-compact', 'East', 'Compact Van • Nissan NV200', 10, 1, 8),
  ('rule-south-scooter', 'South', 'Scooter • NIU NQi Sport', 6, 1, 6);

INSERT INTO shipment_events (shipment_id, status, note, type) VALUES
  ('ship-001', 'Label Created', NULL, 'status'),
  ('ship-001', 'Picked Up', NULL, 'status'),
  ('ship-001', 'Departed Facility', 'Loaded with downtown route', 'handoff'),
  ('ship-001', 'In Transit', 'Courier 3.1 km from destination', 'status'),

  ('ship-002', 'Picked Up', NULL, 'status'),
  ('ship-002', 'In Transit', NULL, 'status'),
  ('ship-002', 'Delivered', 'Left with reception', 'status'),

  ('ship-003', 'Picked Up', NULL, 'status'),
  ('ship-003', 'Delay Reported', 'Traffic incident on Lincoln Tunnel', 'alert'),
  ('ship-003', 'Rerouted', 'Using FDR alternative route', 'status'),

  ('ship-004', 'Scheduled', NULL, 'status'),
  ('ship-004', 'Awaiting Pickup', NULL, 'status'),

  ('ship-005', 'Picked Up', NULL, 'status'),
  ('ship-005', 'In Transit', NULL, 'status'),
  ('ship-005', 'Out for Delivery', 'Courier on last mile segment', 'status'),

  ('ship-006', 'Picked Up', NULL, 'status'),
  ('ship-006', 'In Transit', NULL, 'status'),
  ('ship-006', 'Delivered', 'Signed by recipient', 'status'),

  ('ship-007', 'Scheduled', NULL, 'status'),
  ('ship-007', 'Assigning Courier', NULL, 'status'),

  ('ship-008', 'Picked Up', NULL, 'status'),
  ('ship-008', 'Arrived at Facility', 'Scanned at Midtown micro hub', 'handoff'),
  ('ship-008', 'In Transit', 'Courier 5 stops away', 'status');

INSERT INTO shipment_proofs (id, shipment_id, asset_key, kind, uploaded_by) VALUES
  ('proof-ship-002-photo', 'ship-002', 'proofs/ship-002/pod-photo.jpg', 'photo', 'courier'),
  ('proof-ship-002-signature', 'ship-002', 'proofs/ship-002/pod-signature.png', 'signature', 'customer'),
  ('proof-ship-006-photo', 'ship-006', 'proofs/ship-006/pod-photo.jpg', 'photo', 'courier');

INSERT INTO shipment_waypoints (shipment_id, sequence, label, lat, lng) VALUES
  ('ship-001', 1, 'Hub', 41.8841, -87.6396),
  ('ship-001', 2, 'Stop', 41.8881, -87.6330),
  ('ship-001', 3, 'Current', 41.8905, -87.6293),
  ('ship-001', 4, 'Destination', 41.8898, -87.6217),

  ('ship-002', 1, 'Hub', 37.7792, -122.3971),
  ('ship-002', 2, 'Stop', 37.7878, -122.3990),
  ('ship-002', 3, 'Delivered', 37.7908, -122.3997),

  ('ship-003', 1, 'Depot', 40.7357, -74.1724),
  ('ship-003', 2, 'Delay', 40.7580, -73.9950),
  ('ship-003', 3, 'Current', 40.7540, -73.9840),
  ('ship-003', 4, 'Destination', 40.7549, -73.9816),

  ('ship-004', 1, 'Planned', 40.6782, -73.9442),
  ('ship-004', 2, 'Destination', 40.7128, -74.0060),

  ('ship-005', 1, 'Hub', 25.7480, -80.2680),
  ('ship-005', 2, 'Current', 25.7610, -80.2190),
  ('ship-005', 3, 'Destination', 25.7750, -80.1900),

  ('ship-006', 1, 'Origin', 41.5250, -88.0830),
  ('ship-006', 2, 'Route', 41.7000, -87.8000),
  ('ship-006', 3, 'Delivered', 41.8890, -87.6300),

  ('ship-007', 1, 'Origin', 25.8180, -80.3550),
  ('ship-007', 2, 'Destination', 25.7750, -80.1900),

  ('ship-008', 1, 'Origin', 40.6780, -73.9440),
  ('ship-008', 2, 'Hub', 40.7060, -73.9900),
  ('ship-008', 3, 'Current', 40.7480, -73.9900),
  ('ship-008', 4, 'Destination', 40.7549, -73.9816);

-- Bulk synthetic customers for richer demonstrations
WITH RECURSIVE bulk_customers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM bulk_customers WHERE n < 60
)
INSERT INTO customers (id, name, email, phone, address, city, region, notes)
SELECT
  printf('cust-bulk-%03d', n),
  printf('Demo Customer %03d', n),
  printf('customer%03d@example.com', n),
  printf('+1 (555) 40%02d-%04d', n % 100, 1000 + n),
  printf('%d Innovation Way', 100 + n),
  CASE (n % 4)
    WHEN 0 THEN 'Chicago'
    WHEN 1 THEN 'San Francisco'
    WHEN 2 THEN 'New York'
    ELSE 'Miami'
  END,
  CASE (n % 4)
    WHEN 0 THEN 'Central'
    WHEN 1 THEN 'West'
    WHEN 2 THEN 'East'
    ELSE 'South'
  END,
  CASE
    WHEN n % 5 = 0 THEN 'Prefers SMS notifications.'
    WHEN n % 7 = 0 THEN 'Gate code required.'
    ELSE NULL
  END
FROM bulk_customers;

-- Bulk synthetic couriers to balance the fleet view
WITH RECURSIVE bulk_couriers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM bulk_couriers WHERE n < 40
)
INSERT INTO couriers (
  id, name, avatar, phone, vehicle, region, status, last_seen,
  location_lat, location_lng, speed_kmh, on_time_rate, deliveries_today,
  distance_today_km, eta_variance_minutes, rating
)
SELECT
  printf('courier-bulk-%03d', n),
  printf('Courier Partner %03d', n),
  NULL,
  printf('+1 (555) 60%02d-%04d', n % 100, 2000 + n),
  CASE (n % 4)
    WHEN 0 THEN 'E-Van • Ford Transit'
    WHEN 1 THEN 'Cargo Bike • Urban Arrow'
    WHEN 2 THEN 'Scooter • Gogoro 2'
    ELSE 'Compact Van • Nissan NV200'
  END,
  CASE (n % 4)
    WHEN 0 THEN 'Central'
    WHEN 1 THEN 'West'
    WHEN 2 THEN 'East'
    ELSE 'South'
  END,
  CASE (n % 5)
    WHEN 0 THEN 'offline'
    WHEN 1 THEN 'break'
    ELSE 'online'
  END,
  datetime('now', printf('-%d minutes', (n * 7) % 180)),
  CASE (n % 4)
    WHEN 0 THEN 41.85 + (n * 0.001)
    WHEN 1 THEN 37.77 + (n * 0.001)
    WHEN 2 THEN 40.71 + (n * 0.001)
    ELSE 25.76 + (n * 0.001)
  END,
  CASE (n % 4)
    WHEN 0 THEN -87.65 - (n * 0.001)
    WHEN 1 THEN -122.42 - (n * 0.001)
    WHEN 2 THEN -74.00 - (n * 0.001)
    ELSE -80.19 - (n * 0.001)
  END,
  20 + (n % 35),
  0.85 + ((n % 15) / 100.0),
  8 + (n % 15),
  30 + (n % 90),
  -5 + (n % 11),
  4.2 + ((n % 8) / 10.0)
FROM bulk_couriers;

-- Generate 200 additional shipments spanning regions and statuses
WITH RECURSIVE bulk_shipments(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM bulk_shipments WHERE n < 200
)
INSERT INTO shipments (
  id, tracking_id, order_number, customer_id, courier_id, status,
  created_at, pickup_scheduled_at, picked_up_at, delivered_at,
  eta_minutes, weight_kg, service_level, region,
  origin, destination, proof_asset_key
)
SELECT
  printf('ship-bulk-%04d', n),
  printf('TRK-BULK-%06d', n),
  printf('ORD-BULK-%05d', n),
  printf('cust-bulk-%03d', ((n - 1) % 60) + 1),
  printf('courier-bulk-%03d', ((n - 1) % 40) + 1),
  CASE
    WHEN n % 10 = 0 THEN 'delayed'
    WHEN n % 7 = 0 THEN 'pending'
    WHEN n % 3 = 0 THEN 'delivered'
    ELSE 'in_transit'
  END,
  datetime('now', printf('-%d hours', (n % 96))),
  datetime('now', printf('-%d hours', (n % 96) + 2)),
  CASE
    WHEN n % 7 = 0 THEN NULL
    ELSE datetime('now', printf('-%d hours', (n % 96) + 1))
  END,
  CASE
    WHEN n % 3 = 0 THEN datetime('now', printf('-%d hours', (n % 96) + 3))
    ELSE NULL
  END,
  CASE
    WHEN n % 10 = 0 THEN 90
    WHEN n % 7 = 0 THEN 120
    WHEN n % 3 = 0 THEN 0
    ELSE 45
  END,
  1.5 + ((n % 8) * 0.4),
  CASE
    WHEN n % 5 = 0 THEN 'standard'
    WHEN n % 3 = 0 THEN 'next_day'
    ELSE 'same_day'
  END,
  CASE (n % 4)
    WHEN 0 THEN 'Central'
    WHEN 1 THEN 'West'
    WHEN 2 THEN 'East'
    ELSE 'South'
  END,
  CASE (n % 4)
    WHEN 0 THEN 'Main Hub • Chicago'
    WHEN 1 THEN 'Distribution • Oakland'
    WHEN 2 THEN 'Regional Depot • Newark'
    ELSE 'Micro Fulfilment • Miami'
  END,
  CASE (n % 4)
    WHEN 0 THEN printf('%d Market Street, Chicago', 200 + n)
    WHEN 1 THEN printf('%d Mission Blvd, San Francisco', 300 + n)
    WHEN 2 THEN printf('%d Hudson Ave, New York', 400 + n)
    ELSE printf('%d Biscayne Blvd, Miami', 500 + n)
  END,
  NULL
FROM bulk_shipments;

-- Timeline events for synthetic shipments
INSERT INTO shipment_events (shipment_id, status, note, type)
SELECT id,
       'Label Created',
       NULL,
       'status'
FROM shipments
WHERE id LIKE 'ship-bulk-%';

INSERT INTO shipment_events (shipment_id, status, note, type)
SELECT id,
       'Picked Up',
       NULL,
       'status'
FROM shipments
WHERE id LIKE 'ship-bulk-%' AND picked_up_at IS NOT NULL;

INSERT INTO shipment_events (shipment_id, status, note, type)
SELECT id,
       'Delay Reported',
       'Traffic congestion flagged automatically.',
       'alert'
FROM shipments
WHERE id LIKE 'ship-bulk-%' AND status = 'delayed';

INSERT INTO shipment_events (shipment_id, status, note, type)
SELECT id,
       'Out for Delivery',
       'Courier four stops away.',
       'status'
FROM shipments
WHERE id LIKE 'ship-bulk-%' AND status IN ('in_transit', 'delivered');

INSERT INTO shipment_events (shipment_id, status, note, type)
SELECT id,
       'Delivered',
       'Signed by recipient.',
       'status'
FROM shipments
WHERE id LIKE 'ship-bulk-%' AND status = 'delivered';
