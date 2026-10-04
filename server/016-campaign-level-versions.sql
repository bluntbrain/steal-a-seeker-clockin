-- Preserve every published definition when the current campaign layout is refreshed.
CREATE TABLE campaign_level_versions (
 number integer NOT NULL,
 batch integer NOT NULL,
 recipe jsonb NOT NULL,
 definition jsonb NOT NULL,
 rules_hash text NOT NULL,
 engine_hash text NOT NULL,
 boss text,
 title text NOT NULL,
 zone text NOT NULL,
 published_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(number,rules_hash)
);
INSERT INTO campaign_level_versions SELECT number,batch,recipe,definition,rules_hash,engine_hash,boss,title,zone,published_at FROM campaign_levels;
