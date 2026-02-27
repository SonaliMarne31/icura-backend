const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { gql } = require('graphql-tag');
const { expressMiddleware } = require('@apollo/server/express4');
require("dotenv").config();
const app = express();
const { verifyBffToken, verifyBffTokenFromRequest } = require('./middleware/auth');
const port = 8000;
const { getAllTasks, getAllAppointments, updateAppointment } = require('./db/fetchData');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ─── REST routes ──────────────────────────────────────────────────────────────

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
  const { doctorId, clinicId } = req.user;
  const { id } = req.params;
  const { start_time, end_time, reason } = req.body;

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


// ─── GraphQL ──────────────────────────────────────────────────────────────────

const typeDefs = gql`
  type Task {
    id: ID
    title: String
    description: String
    status: String
    due_date: String
  }

  type Query {
    allTasks: [Task]
  }
`;

const resolvers = {
  Query: {
    allTasks: async (_, __, context) => {
      const { doctorId, clinicId } = context.user;
      console.log('GQL called for getAllTasks');
       const tasks = await getAllTasks(doctorId, clinicId);

      // convert timestamp to ISO string
      return tasks.map(task => ({
        ...task,
        due_date: task.due_date ? new Date(task.due_date).toISOString() : null
      }));
    }
  }
};


// ─── start server ─────────────────────────────────────────────────────────────

const startServer = async () => {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const user = verifyBffTokenFromRequest(req);
      return { user };
    }
  }));

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`REST:    http://localhost:${port}/get-all-tasks`);
    console.log(`GraphQL: http://localhost:${port}/graphql`);
  });
};

startServer();