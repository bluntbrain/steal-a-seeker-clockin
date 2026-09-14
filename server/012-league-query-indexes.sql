-- These match the weekly board and per-player history queries as run history grows.
CREATE INDEX ranked_week_scores ON ranked_runs ((manifest->'contract'->>'week'),wallet) WHERE status='verified' AND manifest ? 'contract';
CREATE INDEX ranked_week_attempts ON ranked_runs (wallet,(manifest->'contract'->>'week')) WHERE manifest ? 'contract';
CREATE INDEX league_player_history ON league_history(wallet,week DESC);
CREATE INDEX auth_challenges_expiry ON auth_challenges(expires_at);
