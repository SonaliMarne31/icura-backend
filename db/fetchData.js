const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "medportal",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    max: 10,               // max connections in pool
    idleTimeoutMillis: 30000,  // close idle connections after 30s
    connectionTimeoutMillis: 2000,
});

async function getAllTasks(doctorId, clinicId) {
    const result = await pool.query(`
    SELECT id, title, description, status, due_date
    FROM tasks
    WHERE doctor_id = $1  
      AND clinic_id = $2  
    ORDER BY due_date ASC
  `, [doctorId, clinicId]);

    return result.rows || null;
}

async function getAllAppointments(doctorId, clinicId) {
    const result = await pool.query(`
    SELECT
        a.id,
        a.status,
        a.reason,
        a.notes,
        a.start_time,
        a.end_time,
        a.timezone,
        a.appointment_type,
        a.doctor_id,
        a.clinic_id,
        p.id          AS patient_id,
        p.first_name,           
        p.last_name,            
        p.dob,
        p.phone,
        p.email
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = $1
      AND a.clinic_id = $2
    ORDER BY a.start_time ASC
`, [doctorId, clinicId]);
    return result.rows || null;
}

async function updateAppointment(id, doctorId, clinicId, start_time, end_time, notes) {
    try {
        // 1. Fetch existing appointment — verify ownership
        const appointment = await pool.query(
            `SELECT * FROM appointments 
             WHERE id         = $1 
               AND doctor_id  = $2 
               AND clinic_id  = $3`,
            [id, doctorId, clinicId]
        );

        if (!appointment.rows.length) {
            throw new Error('Appointment not found');
        }

        const existing = appointment.rows[0];

        // 2. Block reschedule if already cancelled or completed
        if (['cancelled', 'completed'].includes(existing.status)) {
            throw new Error(`Cannot reschedule a ${existing.status} appointment`);
        }

        // 3. Check if doctor has conflicting appointments
        const conflict = await pool.query(
            `SELECT id FROM appointments
             WHERE doctor_id = $1
               AND id        != $2
               AND status    NOT IN ('cancelled', 'no_show')
               AND tstzrange(start_time, end_time) && tstzrange($3::timestamptz, $4::timestamptz)`,
            [existing.doctor_id, id, start_time, end_time]
        );

        if (conflict.rows.length) {
            throw new Error('Time slot is already booked');
        }

        // 4. Update the appointment
        const updated = await pool.query(
            `WITH updated_appointment AS (
        UPDATE appointments
        SET start_time = $1,
            end_time   = $2,
            notes      = COALESCE($3, notes),
            status     = 'scheduled',
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
    )
    SELECT
        a.id,
        a.status,
        a.reason,
        a.notes,
        a.start_time,
        a.end_time,
        a.timezone,
        a.appointment_type,
        a.doctor_id,
        a.clinic_id,
        p.id         AS patient_id,
        p.first_name,
        p.last_name,
        p.dob,
        p.phone,
        p.email
    FROM updated_appointment a
    JOIN patients p ON a.patient_id = p.id`,
            [start_time, end_time, notes, id]
        );

        // return data only, no res here
        return updated.rows[0];

    } catch (err) {
        // re-throw so route handler can catch and respond
        throw err;
    }
}



// async function getAllDoctors() {
//   const result = await pool.query("SELECT * FROM doctors limit 5");
//   return result.rows; // Array of row objects
// }



module.exports = { getAllTasks, getAllAppointments, updateAppointment };