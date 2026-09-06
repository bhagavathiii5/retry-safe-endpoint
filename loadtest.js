// This script fires N identical requests to the server AT THE SAME TIME
// (not one after another) using the same idempotency_key every time.
// Usage: node loadtest.js [numberOfRequests]

const NUM_REQUESTS = parseInt(process.argv[2] || '50', 10);
const KEY = 'test-key-' + Date.now(); // a fresh ticket number each run

async function fireOne() {
  const res = await fetch('http://localhost:3001/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idempotency_key: KEY, amount: 100 }),
  });
  return res.json();
}

async function main() {
  console.log(`Firing ${NUM_REQUESTS} concurrent requests with key: ${KEY}`);

  // Promise.all starts ALL requests basically simultaneously, rather than
  // waiting for one to finish before starting the next.
  const promises = [];
  for (let i = 0; i < NUM_REQUESTS; i++) {
    promises.push(fireOne());
  }
  await Promise.all(promises);

  console.log('All requests finished. Now check the database:');
  console.log(`  SELECT COUNT(*) FROM orders WHERE idempotency_key = '${KEY}';`);
  console.log('If the fix works, this should show exactly 1.');
}

main();
