import { Router } from 'express';
import { validarJWT } from '../middlewares/validar-jwt';
import { getNotificacionesPendientes, marcarLeida, marcarTodasComoLeidas, getNotificacionesLeidas } from '../controllers/notificacionController';
import { guardarSuscripcion } from '../controllers/pushController';

const router = Router();

// Endpoints protegidos por token
router.get('/pendientes', [validarJWT], getNotificacionesPendientes);
router.get('/leidas', [validarJWT], getNotificacionesLeidas);
router.put('/marcar-leida/:id', [validarJWT], marcarLeida);
router.put('/marcar-todas-leidas', validarJWT, marcarTodasComoLeidas);
router.post('/suscribir', [validarJWT], guardarSuscripcion);

export default router;
