-- every .skr SeekerID name with its owner wallet, copied from the public seekertracker.com list. friend search reads
-- this table only, so a third-party outage never blocks a request. the copy is made once, when the table is empty
CREATE TABLE skr_domains (
 name text PRIMARY KEY,
 owner text NOT NULL,
 rank integer,
 created_at timestamptz,
 subdomain_tx text,
 subdomain_tx_blocktime timestamptz,
 name_account text,
 tld_account text,
 non_transferable boolean,
 raw jsonb NOT NULL,
 synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX skr_domains_owner ON skr_domains(owner);
CREATE INDEX skr_domains_prefix ON skr_domains(lower(name) text_pattern_ops);
