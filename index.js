import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import typeDefs from './schema/index.js';
import resolvers from './resolvers/index.js';
import mongoose from 'mongoose';
import User from './models/user.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { verify } from './utils.js';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';

dotenv.config();

async function startApolloServer(typeDefs, resolvers) {
  const app = express();
  const httpServer = createServer(app);
  app.use(
    graphqlUploadExpress({
      maxFileSize: 10000000, // 10 MB
      maxFiles: 1,
    })
  );
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL);
    next();
  });
  app.use(express.static('uploads'));

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });
  const serverCleanup = useServer({ schema }, wsServer);
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const auth = req.headers.authorization || null;
      if (auth) {
        const decodedToken = verify(auth.slice(4));
        const user = await User.findById(decodedToken._id);
        return { user };
      }
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  server.applyMiddleware({ app });

  await new Promise((resolve) =>
    httpServer.listen({ port: process.env.PORT }, resolve)
  );
  console.log(
    `Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`
  );
  mongoose.connect(
    process.env.DB_URL,
    // , { useNewUrlParser: true, useUnifiedTopology: true },
    (err) => {
      if (err) throw err;
      console.log('DB Connected successfully');
    }
  );
  return { server, app };
}
startApolloServer(typeDefs, resolvers);
