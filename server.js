const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// PostgreSQL kapcsolat
const pool = new Pool({
  user: 'openpg',
  host: 'localhost',
  database: 'Tourbooking',
  password: 'openpgpwd',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// API – foglalások lekérdezése
app.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT appointment_date, appointment_time FROM bookings');
    res.json(result.rows);
  } catch (err) {
    console.error('Hiba a lekérdezés során:', err);
    res.status(500).json({ message: 'Adatbázis hiba a lekérdezésnél' });
  }
});

// API – foglalás mentése
app.post('/book', async (req, res) => {
  const { contactName, contactEmail, contactTel, appointmentDate, appointmentTime } = req.body;

  if (!contactName || !contactEmail || !contactTel || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ message: 'Hiányzó mező(k)' });
  }

  try {
    await pool.query(
      `INSERT INTO bookings (contact_name, contact_email, contact_tel, appointment_date, appointment_time)
       VALUES ($1, $2, $3, $4, $5)`,
      [contactName, contactEmail, contactTel, appointmentDate, appointmentTime]
    );
    res.status(200).json({ message: 'Foglalás sikeresen elmentve az adatbázisba.' });
  } catch (err) {
    console.error('DB hiba:', err);
    res.status(500).json({ message: 'Adatbázis hiba.' });
  }
});

// Indítás
app.listen(port, () => {
  console.log(`✅ Szerver fut: http://localhost:${port}`);
});
