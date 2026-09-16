ALTER TABLE wallets ADD COLUMN credits integer NOT NULL DEFAULT 0 CHECK(credits>=0);
ALTER TABLE entitlements ALTER COLUMN order_id DROP NOT NULL;
CREATE TABLE credit_ledger (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES wallets(address), source text NOT NULL,
 delta integer NOT NULL CHECK(delta<>0), balance_after integer NOT NULL CHECK(balance_after>=0),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(wallet,source)
);
CREATE TABLE campaign_credit_stars (
 wallet text NOT NULL REFERENCES wallets(address), mission text NOT NULL,
 stars integer NOT NULL CHECK(stars BETWEEN 1 AND 3), PRIMARY KEY(wallet,mission)
);
CREATE INDEX credit_ledger_wallet_time ON credit_ledger(wallet,created_at DESC);
