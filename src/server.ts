import dotenv from 'dotenv';
dotenv.config(); 

import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import { dbConnection } from './database/config';
import { socketController } from './sockets/socketController';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);


// Inicializar Socket.io con CORS abierto para desarrollo con Ionic
export const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

// ⚡ PASAMOS EL CONTROL DE LOS SOCKETS A NUESTRO MODULO MODULAR
io.on('connection', (socket) => socketController(socket, io));

const startServer = async () => {
  try {
    // 1. Conectar a la Base de Datos primero
    await dbConnection();

    // 2. Encender el servidor HTTP y WebSockets
    server.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor debido a un fallo crítico:', error);
    process.exit(1);
  }
};

startServer();
