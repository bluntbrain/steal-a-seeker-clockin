-- Bind lost-response recovery to the request saved before an installation starts.
-- Existing runs without a key remain readable but cannot be started anew.
ALTER TABLE paid_entries ADD COLUMN start_key uuid;
