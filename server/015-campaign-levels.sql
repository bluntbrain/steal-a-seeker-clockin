-- published campaign levels beyond the twelve authored missions. rows are frozen: the server verifies claims against
-- the stored definition and the stored rules hash, so a generator change never alters an already published level.
CREATE TABLE IF NOT EXISTS campaign_levels(
 number integer PRIMARY KEY CHECK(number>=13),
 batch integer NOT NULL,
 recipe jsonb NOT NULL,
 definition jsonb NOT NULL,
 rules_hash text NOT NULL,
 engine_hash text NOT NULL,
 boss text,
 title text NOT NULL,
 zone text NOT NULL,
 published_at timestamptz NOT NULL DEFAULT now()
);
