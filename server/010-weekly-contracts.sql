CREATE TABLE league_weeks(week date PRIMARY KEY,manifest jsonb NOT NULL,finalized_at timestamptz);
CREATE TABLE league_history(week date REFERENCES league_weeks(week),wallet text REFERENCES wallets(address),entry jsonb NOT NULL,participants integer NOT NULL,PRIMARY KEY(week,wallet));
CREATE TABLE league_achievements(wallet text REFERENCES wallets(address),week date REFERENCES league_weeks(week),earned_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(wallet,week));
CREATE TABLE league_identity(wallet text PRIMARY KEY REFERENCES wallets(address),domain text NOT NULL,checked_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX ranked_contract_lookup ON ranked_runs(wallet,(manifest->'contract'->>'id')) WHERE manifest ? 'contract';
