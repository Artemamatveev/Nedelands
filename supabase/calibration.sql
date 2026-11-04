-- Read-only report for the project owner. Run in the SQL editor against Bittertalen's database.
-- Group by practice score, because historical readiness labels used different rules.
-- These are self-reported outcomes, not a representative or independent exam study.
-- Show sample sizes and a 95% Wilson interval instead of treating a small sample as a pass guarantee.
with grouped as (
  select part, least(90, (pc / 10) * 10) as score_band,
    count(*)::numeric as n,
    count(*) filter (where ok)::numeric as passed
  from public.exam_outcomes
  where pc is not null
  group by part, least(90, (pc / 10) * 10)
), rates as (
  select *, passed / n as rate, 1 + 3.8416 / n as denominator
  from grouped
)
select part, score_band, n, passed,
  round(rate * 100, 1) as reported_pass_percent,
  round(100 * (rate + 3.8416 / (2*n) - 1.96 * sqrt(rate*(1-rate)/n + 3.8416/(4*n*n))) / denominator, 1) as lower_percent,
  round(100 * (rate + 3.8416 / (2*n) + 1.96 * sqrt(rate*(1-rate)/n + 3.8416/(4*n*n))) / denominator, 1) as upper_percent,
  n >= 30 as enough_for_initial_review
from rates order by part, score_band;
