import { Router } from 'express';
import { check } from 'express-validator';
import { validarCampos } from '../middlewares/validar-campos';
import { validarJWT } from '../middlewares/validar-jwt';
import {
    getUsuariosList,
    crearUsuarios,
    crearEditor,
    actualizarUsuario,
    actualizarUAdmin,
    borrarUsuario,
    getUsuario,
    getAllUsers,
    newest,
    set_token_recovery,
    verify_token_recovery,
    change_password,
    getAllEditores,
    listarProfileUsuario,
    actualizarUsuarioRole
} from '../controllers/usuarioController';

const router = Router();

router.get('/', getUsuariosList);
router.get('/recientes', newest);
router.get('/all', [validarJWT], getAllUsers);
router.get('/editores', getAllEditores);
router.get('/:id', [validarJWT], getUsuario);
router.get('/user_profile/:id', listarProfileUsuario);
router.delete('/delete/:id', [validarJWT], borrarUsuario);

router.get('/user_token/set/:email', set_token_recovery);
router.get('/user_verify/token/:email/:codigo', verify_token_recovery);
router.put('/user_password/change/:email', change_password);

router.post('/crear', [
    check('username', 'el username es obligatorio').not().isEmpty(),
    check('password', 'el password es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    validarCampos
], crearUsuarios);

router.post('/crearEditor', [
    check('username', 'el username es obligatorio').not().isEmpty(),
    check('password', 'el password es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    validarCampos
], crearEditor);

router.put('/editar/:id', [
    validarJWT,
    check('username', 'el nombre es obligatorio').not().isEmpty(), // asumiendo username por tu esquema de bd
    check('email', 'el email es obligatorio').isEmail(),
    validarCampos
], actualizarUsuario);

router.put('/editarRole/:id', [
    validarJWT,
    check('role', 'el role es obligatorio').not().isEmpty(),
    validarCampos
], actualizarUsuarioRole);

router.put('/editarAdmin/:id', [
    validarJWT,
    check('username', 'el nombre es obligatorio').not().isEmpty(),
    check('email', 'el email es obligatorio').isEmail(),
    check('role', 'el role es obligatorio').not().isEmpty(),
    validarCampos
], actualizarUAdmin);

export default router;