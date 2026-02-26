const express = require('express');
require("dotenv").config();
const app = express();
const { verifyBffToken } = require('./middleware/auth');
const port = 8000;
const { getAllTasks, getAllAppointments, updateAppointment } = require('./db/fetchData');
app.use(express.json());                        // parses application/json
app.use(express.urlencoded({ extended: true })); // parses form data


app.get('/get-all-tasks', verifyBffToken, async (req, res) => {
  const { doctorId, clinicId } = req.user;

  try {
    const tasks = await getAllTasks(doctorId, clinicId);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get-all-appointments', verifyBffToken, async (req, res) => {
  const { doctorId, clinicId } = req.user;

  try {
    const tasks = await getAllAppointments(doctorId, clinicId);
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/appointments/:id/reschedule', verifyBffToken, async (req, res) => {
    const { doctorId, clinicId }        = req.user;
    const { id }                        = req.params;
    const { start_time, end_time, reason } = req.body;

    // ✓ validate required fields
    if (!start_time || !end_time) {
        return res.status(400).json({ error: 'start_time and end_time are required' });
    }
  try {
    const appt = await updateAppointment(id, doctorId, clinicId, start_time, end_time, reason);
    res.json(appt);
  } catch (err) {
    console.error('Error rescheduling appointment:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// app.get('/get-all', checkJwt, async (req, res) => {
//   try {
//     const doctors = await getAllDoctors();
//     res.json(doctors);
//   } catch (err) {
//     console.error('Error fetching doctors:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// app.get('/get-doctor', checkJwt, async (req, res) => {

//   const emailid = req.auth.payload[process.env.AUTH0_AUDIENCE + '/email'];
//   console.log('email id - backend ', emailid);
//   try {
//     const doctors = await getDoctorByEmail(emailid);
//     res.json(doctors);
//   } catch (err) {
//     console.error('Error fetching doctors:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }

// });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


