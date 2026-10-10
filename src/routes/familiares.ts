import { Router } from 'express';
import { validarJWT } from '../middlewares/validar-jwt';
import {  agregarFamiliar, obtenerFamiliares, actualizarFamiliar, borrarFamiliar } from '../controllers/familiarController';

const router = Router();

// Todas las rutas de perfiles quedan protegidas por el token de sesión
router.use(validarJWT);


// familiares
router.post('/crear', [validarJWT], agregarFamiliar);
router.get('/listar', [validarJWT], obtenerFamiliares);
router.put('/editar/:id', [validarJWT], actualizarFamiliar);
router.delete('/borrar/:id', [validarJWT], borrarFamiliar);

export default router;
