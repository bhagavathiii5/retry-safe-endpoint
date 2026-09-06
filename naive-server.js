// THIS IS THE INTENTIONALLY-WRONG VERSION.
// We build this first so we can prove, with numbers, that it breaks.

const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

app.post('/orders', async (req, res) => {
  const { idempotency_key, amount } = req.body;

  // Step A: "check if this order already exists"
  const existing = await pool.query(
    'SELECT * FROM orders WHERE idempotency_key = $1',
    [idempotency_key]
  );

  // Step B: "if not, create it"
  // THE BUG: between Step A finishing and Step B running, another request
  // can sneak in, do its own Step A, see nothing exists yet, and also
  // proceed to Step B. Now two orders get created for one ticket number.
  if (existing.rows.length > 0) {
    return res.json({ order: existing.rows[0], note: 'returned existing order' });
  }

  const result = await pool.query(
    'INSERT INTO orders (idempotency_key, amount) VALUES ($1, $2) RETURNING *',
    [idempotency_key, amount]
  );

  res.json({ order: result.rows[0], note: 'created new order' });
});

app.listen(3000, () => console.log('Naive server running on http://localhost:3000'));
