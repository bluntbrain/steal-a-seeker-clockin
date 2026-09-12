CREATE TABLE operator_reviews (
 id uuid PRIMARY KEY, request_hash text NOT NULL, action text NOT NULL,
 target_id uuid NOT NULL, actor text NOT NULL, note text NOT NULL,
 expected_hash text NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE return_allocations ADD COLUMN attempt_ceiling integer NOT NULL DEFAULT 8
 CHECK(attempt_ceiling BETWEEN 8 AND 128);
