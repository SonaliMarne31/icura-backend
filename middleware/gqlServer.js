// backend - add this alongside your existing express app
const { ApolloServer, gql } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { getAllTasks, getAllAppointments, updateAppointment } = require('../db/fetchData');

const typeDefs = gql`
  type Task {
    id: ID
    title: String
    description: String
    status: String
    doctorId: String
    clinicId: String
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
      return await getAllTasks(doctorId, clinicId);
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

app.use('/graphql', expressMiddleware(server, {
  context: async ({ req }) => {
    // reuse your existing verifyBffToken logic here
    const user = verifyBffTokenFromRequest(req);
    return { user };
  }
}));