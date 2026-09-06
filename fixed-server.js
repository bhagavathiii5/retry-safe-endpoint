// THIS IS THE FIXED VERSION.
// Instead of checking first (two separate trips to the database, with a gap
// in between where two requests can both slip through), we just TRY to
// insert directly. Postgres's UNIQUE constraint on idempotency_key does the
// safety check for us, atomically, as part of the single insert operation.

const express = require('express');
const cors=require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/orders', async (req, res) => {
  const { idempotency_key, amount } = req.body;

  try {
    // Just try to insert. No "check first" step at all.
    const result = await pool.query(
      'INSERT INTO orders (idempotency_key, amount) VALUES ($1, $2) RETURNING *',
      [idempotency_key, amount]
    );
    return res.json({ order: result.rows[0], note: 'created new order' });

  } catch (err) {
    // Postgres error code 23505 = "unique_violation" =
    // "someone already used this idempotency_key."
    if (err.code === '23505') {
      const existing = await pool.query(
        'SELECT * FROM orders WHERE idempotency_key = $1',
        [idempotency_key]
      );
      return res.json({ order: existing.rows[0], note: 'returned existing order (replay)' });
    }
    // Some other unexpected error — not part of this project's scope.
    throw err;
  }
});

app.listen(3001, () => console.log('Fixed server running on http://localhost:3001'));
