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


const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta de estado de la API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend AppReciclaje listo ♻️'
  });
});

// Aquí importaremos y usaremos las rutas más adelante (ej: app.use('/api/usuarios', usuarioRoutes);)
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/perfiles', perfilesRoutes);
app.use('/api/familiares', familiaresRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reglas', reglasRoutes);
app.use('/api/terminos', terminosRoutes);

export default app;
