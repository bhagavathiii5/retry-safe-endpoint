# Retry-Safe Endpoint

**The problem:** When a client's network is slow, it often retries a request
that actually succeeded the first time — leading to duplicate orders,
duplicate charges, or duplicate anything. This project makes one endpoint
safe to call more than once with the same intent.

**Live demo:** https://retry-safe-endpoint.onrender.com/

## How it works

Each request carries an `idempotency_key`. The `orders` table has a
`UNIQUE` constraint on that column. Instead of checking "does this exist?"
before inserting (which has a race condition — see `naive-server.js`,
tagged as `naive-version` in git history), the fixed version
(`fixed-server.js`) just attempts the insert directly and catches
Postgres's `23505` unique-violation error to detect a duplicate.

## The tradeoff

I used a database-level unique constraint instead of a distributed lock
(e.g. Redis-based locking). This is simpler and sufficient because there's
a single Postgres instance acting as the source of truth — a distributed
lock would only be necessary across multiple independent databases.

## Proof (run it yourself)

```
## Proof (run it yourself) Tested locally with 500 concurrent requests against a real PostgreSQL 16 database, and again on the live deployment with real HTTP requests: - **Naive version** (check-then-insert): crashes under concurrency with `duplicate key value violates unique constraint` errors — see `naive-error-sample.txt` and `RESULTS.md` for the full writeup. - **Fixed version** (insert-first, catch-conflict): 300 concurrent requests with one shared key → exactly 1 row created, 0 errors, 0 duplicates. - **Live deployment verified**: same request sent twice to https://retry-safe-endpoint.onrender.com/orders → 1 row created on the first call, a clean "replay" response on the second, confirmed directly in the production database. Full methodology and raw output in `RESULTS.md`. 
```

Result: 500 concurrent calls with one key → 1 row created, 499 replays
returned, 0 duplicates.

Compare against the naive version (`git checkout naive-version`) running
the identical test — it produces multiple duplicate rows instead.

## Setup

1. `createdb ordersdb`
2. `psql -d ordersdb -f schema.sql`
3. `npm install`
4. `node fixed-server.js`
