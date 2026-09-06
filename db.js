// This file just opens a connection to Postgres and lets other files reuse it.
// A "Pool" means: instead of opening a brand new connection for every single
// request (slow), we keep a small set of connections open and reuse them.

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'ordersdb',
});

module.exports = pool;
