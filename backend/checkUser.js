const db = require('./db/connection');

(async () => {
  try {
    const { rows } = await db.query('SELECT user_id, name, email, password_hash, role FROM "user" LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('QUERY ERROR', err);
  } finally {
    process.exit();
  }
})();
