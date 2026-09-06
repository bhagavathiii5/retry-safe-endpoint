-- Run this once to set up the database.
-- The UNIQUE constraint on idempotency_key is the entire trick of this project:
-- Postgres itself will refuse to store two rows with the same key,
-- even if two requests arrive at the exact same instant.

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  idempotency_key TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
