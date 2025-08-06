const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000; // EZ A JAVÍTOTT RÉSZ

// PostgreSQL kapcsolat
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
      rejectUnauthorized: false
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/bookings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM bookings ORDER BY appointment_date, appointment_time');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Hiba a foglalások lekérdezésekor:', error);
    res.status(500).json({ error: 'Szerverhiba' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { contactName, contactEmail, contactTel, appointmentDate, appointmentTime } = req.body;

  if (!contactName || !contactEmail || !contactTel || !appointmentDate || !appointmentTime) {
    return res.status(400).json({ message: 'Hiányzó mező(k)' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (contact_name, contact_email, contact_tel, appointment_date, appointment_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [contactName, contactEmail, contactTel, appointmentDate, appointmentTime]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Hiba az új foglalás létrehozásakor:', error);
    res.status(500).json({ error: 'Szerverhiba' });
  }
});

app.listen(port, () => {
  console.log(`A szerver fut a http://localhost:${port} címen`);
});
