import { Router } from 'express';
import { body } from 'express-validator';
import { getTerminos, updateTerminos } from '../controllers/terminosController';
import { validarJWT } from '../middlewares/validar-jwt'; //
import { validarCampos } from '../middlewares/validar-campos'; //

const router = Router();

// Endpoint público para la PWA móvil
router.get('/', getTerminos);

// Endpoint protegido para el Administrador
router.put(
  '/terminos',
  [
    validarJWT, // 1. Verifica token x-token
    body('introduccion', 'La introducción legal es obligatoria').notEmpty().trim(),
    body('secciones', 'Las secciones deben ser un arreglo estructurado').isArray({ min: 1 }),
    body('version', 'La especificación de versión es requerida').notEmpty().trim(),
    validarCampos // 2. Ataja errores de express-validator
  ],
  updateTerminos
);

export default router;
