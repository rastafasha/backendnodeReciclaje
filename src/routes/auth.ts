import { Router } from 'express';
import { check } from 'express-validator';
import { validarCampos } from '../middlewares/validar-campos';
import { login, googleSignIn, renewToken } from '../controllers/authController';
import { validarJWT } from '../middlewares/validar-jwt';

const router = Router();

router.post('/login', [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarCampos
], login);

router.post('/google', [
    check('token', 'El token es obligatorio').not().isEmpty(),
    validarCampos
], googleSignIn);

router.get('/renew', [validarJWT], renewToken);

export default router;
