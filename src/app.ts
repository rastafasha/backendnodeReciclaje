import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import usuarioRoutes from './routes/usuarios';
import materialesRoutes from './routes/materiales';
import perfilesRoutes from './routes/perfiles';
import familiaresRoutes from './routes/familiares';
import uploadsRoutes from './routes/uploads';
import notificacionesRoutes from './routes/notificaciones';
import reglasRoutes from './routes/reglas';
import terminosRoutes from './routes/terminosRoutes';
import gamificacionRoutes from './routes/gamificacion';
import comunicadoRoutes from './routes/comunicado';
import busquedaRoutes from './routes/busqueda';
import consejosRoutes from './routes/consejo';
import sorteoRoutes from './routes/sorteo';

const app = express();

// =========================================================================
// 🛡️ CONFIGURACIÓN DE CORS PARA APPRECICLAJE (DESARROLLO LOCAL Y PROD)
// =========================================================================
const allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4203", // 👈 Tu panel Admin CRM corriendo aquí
  "http://localhost:8100", // 👈 Tu panel Admin CRM corriendo aquí
  "http://localhost:3001", // 👈 Tu panel Admin CRM corriendo aquí
  "http://localhost:3003", // 👈 Tu panel Admin CRM corriendo aquí
  "https://admn-reciclaje.vercel.app",
  "https://app-reciclaje-eight.vercel.app",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman o peticiones internas de servidores)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ [CORS RECHAZADO]: El origen ${origin} no está autorizado.`);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  // Cabeceras estrictas que envían tus interceptores de Angular
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-token", // 👈 Indispensable para validar sesiones en Node.js
    "X-Token", 
    "Accept"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 200 // Libera el preflight check en Chrome/Edge sin demoras
};

// Middlewares globales en orden secuencial correcto
app.use(cors(corsOptions)); 
app.use(express.json());

// Ruta de estado de la API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend AppReciclaje listo ♻️'
  });
});

// Enrutadores principales de tu API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/perfiles', perfilesRoutes);
app.use('/api/familiares', familiaresRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reglas', reglasRoutes);
app.use('/api/terminos', terminosRoutes);
app.use('/api/gamificacion', gamificacionRoutes);
app.use('/api/comunicados', comunicadoRoutes);
app.use('/api/consejos', consejosRoutes);
app.use('/api/todo', busquedaRoutes);
app.use('/api/sorteo', sorteoRoutes);

export default app;
