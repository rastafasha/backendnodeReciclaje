import { Router } from 'express';
import { getTodo, getDocumentosColeccion } from '../controllers/busquedaController';
import { validarJWT } from '../middlewares/validar-jwt';

const router = Router();

// Endpoints de rastreo protegidos por seguridad del CRM
router.get('/:busqueda', validarJWT, getTodo);
router.get('/coleccion/:tabla/:busqueda', validarJWT, getDocumentosColeccion);

export default router;