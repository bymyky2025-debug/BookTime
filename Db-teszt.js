const { Pool } = require('pg');

// PostgreSQL kapcsolat – módosítsd ha szükséges
const pool = new Pool({
  user: 'openpg',
  host: 'localhost',
  database: 'Tourbooking',
  password: 'openpgpwd',
  port: 5432,
});

async function testConnectionAndTable() {
  try {
    // Kapcsolat teszt
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Kapcsolat sikeres! Időbélyeg az adatbázisból:', res.rows[0]);

    // Tábla ellenőrzés
    const tableCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'bookings'
    `);

    if (tableCheck.rows.length === 0) {
      console.warn('⚠️ Figyelem: a "bookings" tábla nem létezik az adatbázisban.');
    } else {
      console.log('✅ "bookings" tábla megtalálva.');

      // Adatok lekérdezése a táblából
      const bookings = await pool.query('SELECT * FROM bookings LIMIT 5');
      if (bookings.rows.length > 0) {
        console.log('📋 Példák a bookings táblából:');
        console.table(bookings.rows);
      } else {
        console.log('ℹ️ A "bookings" tábla üres.');
      }
    }
  } catch (err) {
    console.error('❌ Hiba az adatbázisművelet során:', err.message);
  } finally {
    await pool.end(); // Kapcsolat lezárása
  }
}

testConnectionAndTable();
