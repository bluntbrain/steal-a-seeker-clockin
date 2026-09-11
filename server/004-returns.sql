CREATE TABLE return_reservations (
 id uuid PRIMARY KEY, external_key text NOT NULL UNIQUE, wallet text NOT NULL REFERENCES wallets(address),
 cluster text NOT NULL CHECK(cluster='solana:devnet'), mint text NOT NULL, token_program text NOT NULL,
 decimals integer NOT NULL CHECK(decimals BETWEEN 0 AND 9), treasury text NOT NULL, source text NOT NULL, destination text NOT NULL,
 amount numeric(20,0) NOT NULL CHECK(amount>0 AND amount<=18446744073709551615), fee_lamports bigint NOT NULL CHECK(fee_lamports>0),
 state text NOT NULL DEFAULT 'held' CHECK(state IN ('held','released','settled')), release_reason text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX return_reserves_held ON return_reservations(mint,treasury) WHERE state='held';
CREATE TABLE return_allocations (
 id uuid PRIMARY KEY, reservation_id uuid NOT NULL UNIQUE REFERENCES return_reservations(id),
 outcome text NOT NULL CHECK(outcome IN ('success','refund')),
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','pending','settled','review')),
 reference text NOT NULL UNIQUE, memo text NOT NULL UNIQUE, active_attempt uuid,
 receipt jsonb, detail text, lease_until timestamptz, lease_token uuid,
 process_after timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE return_attempts (
 id uuid PRIMARY KEY, allocation_id uuid NOT NULL REFERENCES return_allocations(id), sequence integer NOT NULL CHECK(sequence>0),
 signature text NOT NULL UNIQUE, wire text NOT NULL, blockhash text NOT NULL, last_valid_height numeric(20,0) NOT NULL,
 context_slot numeric(20,0) NOT NULL, state text NOT NULL CHECK(state IN ('prepared','pending','expired','failed','settled','review')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(allocation_id,sequence)
);
ALTER TABLE return_allocations ADD FOREIGN KEY(active_attempt) REFERENCES return_attempts(id);
CREATE INDEX returns_queue ON return_allocations(process_after) WHERE state IN ('queued','pending');
