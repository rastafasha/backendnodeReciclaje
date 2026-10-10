import { Router } from 'express';
import { check } from 'express-validator';
import { validarCampos } from '../middlewares/validar-campos';
import { validarJWT } from '../middlewares/validar-jwt';
import {
    crearEntregaMaterial,
    getHistorialUsuario,
    getEstadisticasGlobales
} from '../controllers/materialesController';

const router = Router();

// Todos los endpoints de materiales requerirán una sesión activa (Token válido)
router.use(validarJWT);

/**
 * Ruta: POST /api/materiales
 */
router.post('/', [
    check('comida', 'El bloque de comida (DESAYUNO, ALMUERZO, CENA) es obligatorio').isIn(['DESAYUNO', 'ALMUERZO', 'CENA']),
    check('categoria', 'La categoría de alimento es obligatoria').isIn(['PROTEINAS', 'CARBOHIDRATOS', 'VEGETALES_FRUTAS']),
    check('nombreItem', 'El nombre del ítem es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria y no debe superar los 250 caracteres').isLength({ min: 5, max: 250 }),
    validarCampos // Tu middleware encargado de escupir los errores en JSON si algo falta
], crearEntregaMaterial);

/**
 * Ruta: GET /api/materiales/historial
 */
router.get('/historial', getHistorialUsuario);

/**
 * Ruta: GET /api/materiales/global
 */
router.get('/global', getEstadisticasGlobales);

export default router;
