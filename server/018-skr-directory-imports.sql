-- marks the one-time .skr copy as finished. the copy upserts page by page, so an interrupted copy simply runs again
-- on the next boot and fills the gaps; only a finished copy is skipped
CREATE TABLE skr_directory_imports (
 id serial PRIMARY KEY,
 names integer NOT NULL,
 completed_at timestamptz NOT NULL DEFAULT now()
);
