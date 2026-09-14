-- Read-only: scoring participation retention, not total app/practice retention.
WITH active AS (
 SELECT DISTINCT wallet, (manifest->'contract'->>'week')::date AS week
 FROM ranked_runs WHERE manifest ? 'contract'
), counts AS (
 SELECT current.week,count(*) AS players,
 count(previous.wallet) AS returning_from_previous_week
 FROM active current LEFT JOIN active previous
 ON previous.wallet=current.wallet AND previous.week=current.week-7
 GROUP BY current.week
)
SELECT * FROM counts ORDER BY week;
