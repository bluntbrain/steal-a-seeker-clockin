ALTER TABLE orders ADD COLUMN promotion_snapshot jsonb;
CREATE TABLE promotion_redemptions (
 promotion_id text NOT NULL,
 wallet text NOT NULL REFERENCES wallets(address),
 state text NOT NULL CHECK(state IN ('reserved','granted','released')),
 order_id uuid UNIQUE REFERENCES orders(id),
 granted_skus jsonb NOT NULL DEFAULT '[]',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(promotion_id,wallet)
);
CREATE INDEX promotion_capacity ON promotion_redemptions(promotion_id,state);
