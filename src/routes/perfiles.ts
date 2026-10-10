import { Router } from 'express';
import { check } from 'express-validator';
import { validarCampos } from '../middlewares/validar-campos';
import { validarJWT } from '../middlewares/validar-jwt';
import { getMiPerfil, actualizarPerfil} from '../controllers/profileController';

const router = Router();

// Todas las rutas de perfiles quedan protegidas por el token de sesión
router.use(validarJWT);

/**
 * Ruta: GET /api/perfiles/mi-perfil
 */
router.get('/mi-perfil', getMiPerfil);

/**
 * Ruta: PUT /api/perfiles/actualizar
 */
router.put('/actualizar', [
    check('first_name', 'El nombre no puede ir vacío si se actualiza').optional().not().isEmpty(),
    check('phone', 'El formato del teléfono no es válido').optional().isString(),
    validarCampos
], actualizarPerfil);


export default router;
