const express = require('express');
const { Pool } = require("pg");
require("dotenv").config();
const app = express();
const { checkJwt } = require('./middleware/auth');
const port = 8000;

app.get('/get-all', checkJwt, async (req, res) => {
  try {
    const doctors = await getAllDoctors();
    res.json(doctors);
  } catch (err) {
    console.error('Error fetching doctors:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get-doctor', checkJwt, async (req, res) => {

    const emailid = req.auth.payload[process.env.AUTH0_AUDIENCE+ '/email'];
    console.log('email id - backend ', emailid);
    try {
        const doctors = await getDoctorByEmail(emailid);
        res.json(doctors);
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "medportal",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "password",
  max:      10,               // max connections in pool
  idleTimeoutMillis:  30000,  // close idle connections after 30s
  connectionTimeoutMillis: 2000,
});

async function getAllDoctors() {
  const result = await pool.query("SELECT * FROM doctors limit 5");
  return result.rows; // Array of row objects
}

async function getDoctorByEmail(email) {
  // Use $1 as a placeholder for the email variable
  const result = await pool.query("SELECT * FROM doctors WHERE email = $1", [email]);
  
  // Since email is unique, return the first row or null
  return result.rows[0] || null; 
}

async function getAppointmentsByEmail(email) {
  // Use $1 as a placeholder for the email variable
  const result = await pool.query("SELECT * FROM doctors WHERE email = $1", [email]);
  
  // Since email is unique, return the first row or null
  return result.rows[0] || null; 
}


