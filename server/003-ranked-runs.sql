CREATE TABLE daily_manifests (
 day date PRIMARY KEY, manifest jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ranked_runs (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES wallets(address), day date NOT NULL REFERENCES daily_manifests(day),
 request_key uuid NOT NULL, manifest jsonb NOT NULL,
 status text NOT NULL CHECK(status IN ('issued','verifying','verified','rejected','error','abandoned')),
 issued_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 submitted_at timestamptz, replay_hash text, replay jsonb, result jsonb, detail text,
 verify_after timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, lease_token uuid, verify_attempts integer NOT NULL DEFAULT 0,
 UNIQUE(wallet,request_key)
);
CREATE UNIQUE INDEX ranked_one_open ON ranked_runs(wallet) WHERE status IN ('issued','verifying');
CREATE INDEX ranked_queue ON ranked_runs(verify_after) WHERE status='verifying';
CREATE INDEX ranked_leaderboard ON ranked_runs(day,wallet) WHERE status='verified';
