import { Router } from 'express';
import { 
  enviarComunicadoGlobal, 
  obtenerMisComunicados, 
  marcarTodasComoLeidas, 
  contarNotificacionesPendientes,
  eliminarComunicadoGlobal
} from '../controllers/comunicadoController';
import { validarJWT } from '../middlewares/validar-jwt'; // Tu validador de tokens del CRM

const router = Router();

// Endpoints de comunicación y cartelera protegidos por JWT
router.post('/enviar-global', validarJWT, enviarComunicadoGlobal);
router.get('/mis-comunicados', validarJWT, obtenerMisComunicados);
router.put('/marcar-todas-leidas', validarJWT, marcarTodasComoLeidas);
router.get('/pendientes-conteo', validarJWT, contarNotificacionesPendientes);
router.delete('/delete/:id', [validarJWT], eliminarComunicadoGlobal);
export default router;