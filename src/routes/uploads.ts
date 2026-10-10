import { Router } from 'express';
import expressFileUpload from 'express-fileupload';
import { validarJWT } from '../middlewares/validar-jwt';
import { fileUpload, retornaImagen } from '../controllers/uploadsController';

const router = Router();

// Habilitamos el interceptor de archivos en memoria exclusivo para este módulo
router.use(expressFileUpload());

// Rutas expuestas para la App de Ionic
router.put('/:tipo/:id', [validarJWT], fileUpload);
router.get('/:tipo/:foto', retornaImagen);

export default router;
