ALTER TABLE orders ADD COLUMN currency text NOT NULL DEFAULT 'SKR' CHECK(currency IN ('SKR','SOL'));
ALTER TABLE orders ADD COLUMN price_snapshot jsonb;
