import { Router } from 'express';
import { obtenerTablaLiderazgo, obtenerMetricasDashboard } from '../controllers/gamificacionController';


const router = Router();

// Endpoint para el listado de liderazgo y clasificación
router.get('/participantes-liderazgo', obtenerTablaLiderazgo);
router.get('/dashboard-metricas', obtenerMetricasDashboard);

export default router;