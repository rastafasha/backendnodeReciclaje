import dotenv from 'dotenv';
dotenv.config(); 

import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import { dbConnection } from './database/config';
import { socketController } from './sockets/socketController';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4203", // 👈 Tu panel Admin CRM corriendo aquí
  "http://localhost:4206",
  "http://localhost:4207",
  "http://localhost:4300"
];

// Inicializar Socket.io heredando tu lista blanca simplificada
export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on('connection', (socket) => socketController(socket, io));

const startServer = async () => {
  try {
    await dbConnection();
    server.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor debido a un fallo crítico:', error);
    process.exit(1);
  }
};

startServer();
