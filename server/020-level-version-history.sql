-- A layout can be fixed under the same rules hash (a guard walled off, 24 October 2026), so one hash may have several
-- archived definitions. Replays read the newest one for their hash.
ALTER TABLE campaign_level_versions DROP CONSTRAINT campaign_level_versions_pkey;
ALTER TABLE campaign_level_versions ADD PRIMARY KEY(number,rules_hash,published_at);
