import 'dotenv/config';
import { Pool } from 'pg';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

pool.query('SELECT 1', (err, result) => {
  if (err) {
    console.error('Query error:', err);
    process.exit(1);
  } else {
    console.log('Query success:', result.rows);
    pool.end();
    process.exit(0);
  }
});

setTimeout(() => {
  console.error('Timeout');
  process.exit(1);
}, 5000);
