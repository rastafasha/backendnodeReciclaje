import { Router } from 'express';
import { obtenerTablaLiderazgo, obtenerMetricasDashboard,
    ejecutarSorteoProporcional,
notificarGanadoresPush
 } from '../controllers/gamificacionController';
 
import { validarJWT } from '../middlewares/validar-jwt';

const router = Router();

// Endpoint para el listado de liderazgo y clasificación
router.get('/participantes-liderazgo', obtenerTablaLiderazgo);
router.get('/dashboard-metricas', obtenerMetricasDashboard);

router.post('/ejecutar-sorteo', validarJWT, ejecutarSorteoProporcional);
router.post('/notificar-ganadores', validarJWT, notificarGanadoresPush);

export default router;