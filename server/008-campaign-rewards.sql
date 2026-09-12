ALTER TABLE orders ADD COLUMN campaign_terms jsonb;
CREATE TABLE campaign_rebates (
 wallet text PRIMARY KEY REFERENCES wallets(address),
 reservation_id uuid NOT NULL UNIQUE REFERENCES return_reservations(id),
 terms jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE campaign_runs (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES wallets(address),
 mission text NOT NULL, rules_hash text NOT NULL, replay_hash text NOT NULL,
 replay jsonb NOT NULL, result jsonb NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(wallet,mission,rules_hash,replay_hash)
);
CREATE INDEX campaign_runs_board ON campaign_runs(rules_hash,wallet,mission);
