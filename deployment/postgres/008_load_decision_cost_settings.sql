ALTER TABLE pay_settings ADD COLUMN IF NOT EXISTS fuel_cost_per_mile_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pay_settings ADD COLUMN IF NOT EXISTS maintenance_cost_per_mile_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pay_settings ADD COLUMN IF NOT EXISTS insurance_cost_per_mile_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pay_settings ADD COLUMN IF NOT EXISTS truck_cost_per_mile_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pay_settings ADD COLUMN IF NOT EXISTS other_cost_per_mile_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pay_settings ADD COLUMN IF NOT EXISTS factoring_fee_basis_points INTEGER NOT NULL DEFAULT 0;
