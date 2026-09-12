-- An instruction can fulfill only one purchase/entry across both products.
CREATE TABLE transfer_receipts (
 signature text NOT NULL, instruction_index integer NOT NULL CHECK(instruction_index>=0),
 source_kind text NOT NULL CHECK(source_kind IN ('order','paid_entry')), source_id uuid NOT NULL,
 slot bigint NOT NULL, PRIMARY KEY(signature,instruction_index), UNIQUE(source_kind,source_id)
);
INSERT INTO transfer_receipts(signature,instruction_index,source_kind,source_id,slot)
 SELECT signature,instruction_index,'order',order_id,slot FROM payment_receipts;
CREATE TABLE paid_entries (
 id uuid PRIMARY KEY, wallet text NOT NULL REFERENCES wallets(address), request_key uuid NOT NULL,
 status text NOT NULL CHECK(status IN ('quoted','verifying_payment','ready','running','verifying_run','won','lost','refunding','returned','refunded','expired','review')),
 terms_version text NOT NULL CHECK(terms_version='devnet-v1'), quote jsonb NOT NULL, manifest jsonb NOT NULL,
 reservation_id uuid NOT NULL UNIQUE REFERENCES return_reservations(id), allocation_id uuid UNIQUE REFERENCES return_allocations(id),
 payment_authorization jsonb, paid_signature text UNIQUE, paid_slot bigint, ready_until timestamptz,
 run_id uuid UNIQUE, run_started_at timestamptz, run_expires_at timestamptz,
 replay jsonb, replay_hash text, result jsonb, submitted_at timestamptz,
 verify_after timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, lease_token uuid, verify_attempts integer NOT NULL DEFAULT 0,
 detail text, checked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(wallet,request_key)
);
CREATE UNIQUE INDEX paid_entries_one_active ON paid_entries(wallet) WHERE status IN ('quoted','verifying_payment','ready','running','verifying_run','won','refunding');
CREATE INDEX paid_entries_payment_queue ON paid_entries(checked_at) WHERE status IN ('quoted','verifying_payment','expired');
CREATE INDEX paid_entries_run_queue ON paid_entries(verify_after) WHERE status='verifying_run';
CREATE TABLE paid_payment_attempts (
 entry_id uuid NOT NULL REFERENCES paid_entries(id), signature text NOT NULL, state text NOT NULL DEFAULT 'pending', detail text,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(entry_id,signature)
);
