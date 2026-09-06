# Actual Test Results

Both servers were run locally against a real PostgreSQL 16 database, then
hit with 300 simultaneous identical requests (same idempotency_key) using
loadtest.js / loadtest-fixed.js.

## Naive version (naive-server.js) — check-then-insert
Result: multiple requests crashed with unhandled `duplicate key value
violates unique constraint` errors. See `naive-error-sample.txt` for a
sample. Clients received raw HTML 500 error pages instead of a clean
response — the race condition manifests as **crashes under load**, not
silent duplication, because the naive code never wraps its insert in a
try/catch.

## Fixed version (fixed-server.js) — insert-first, catch-conflict
Result: 300/300 requests succeeded. Exactly 1 row was created for the
shared idempotency_key; the other 299 received a clean "returned existing
order (replay)" response. Zero errors in the server log.

```
$ psql -d ordersdb -c "SELECT idempotency_key, COUNT(*) FROM orders
  WHERE idempotency_key = 'fixed-test-1788631305' GROUP BY idempotency_key;"

    idempotency_key    | count
-----------------------+-------
 fixed-test-1788631305 |     1
```
