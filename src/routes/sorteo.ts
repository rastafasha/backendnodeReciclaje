import { Router } from 'express';
import { ejecutarTombolaAutomatizada } from '../controllers/sorteoController';
// Importa tus middlewares de autenticación si necesitas proteger la ruta (ej. validarJWT)

const router = Router();

// POST o GET: Disparado exclusivamente desde el CRM del Administrador
router.post('/ejecutar-tombola', ejecutarTombolaAutomatizada);

export default router;
