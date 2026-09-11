CREATE TABLE IF NOT EXISTS wallets (
 address text PRIMARY KEY, equipment jsonb NOT NULL DEFAULT '{}', progress jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_challenges (
 id uuid PRIMARY KEY, wallet text NOT NULL, payload jsonb NOT NULL, expires_at timestamptz NOT NULL, consumed_at timestamptz
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, wallet text NOT NULL REFERENCES wallets(address), expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES wallets(address), sku text NOT NULL, idempotency_key uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('quoted','verifying','fulfilled','needs_review')),
 cluster text NOT NULL CHECK(cluster='solana:devnet'), mint text NOT NULL, token_program text NOT NULL, decimals integer NOT NULL CHECK(decimals BETWEEN 0 AND 9),
 amount numeric(20,0) NOT NULL CHECK(amount>0), recipient text NOT NULL, source text NOT NULL, destination text NOT NULL,
 reference text NOT NULL UNIQUE, memo text NOT NULL UNIQUE, created_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 signature text, detail text, checked_at timestamptz, UNIQUE(wallet,idempotency_key)
);
CREATE TABLE IF NOT EXISTS order_attempts (
 signature text NOT NULL, order_id uuid NOT NULL REFERENCES orders(id), state text NOT NULL DEFAULT 'pending', detail text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(order_id,signature)
);
CREATE TABLE IF NOT EXISTS payment_receipts (
 signature text PRIMARY KEY, order_id uuid NOT NULL UNIQUE REFERENCES orders(id), instruction_index integer NOT NULL,
 slot bigint NOT NULL, finalized_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS entitlements (
 wallet text NOT NULL REFERENCES wallets(address), sku text NOT NULL, order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
 granted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(wallet,sku)
);
CREATE INDEX IF NOT EXISTS orders_reconcile ON orders(checked_at) WHERE status IN ('quoted','verifying');
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
