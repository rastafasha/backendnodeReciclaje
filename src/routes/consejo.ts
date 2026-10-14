import { Router } from 'express';
import { validarJWT } from '../middlewares/validar-jwt';
import { getConsejos, createConsejo, updateConsejo, deleteConsejo } from '../controllers/consejosController';

const router = Router();


// 💡 Rutas de Consejos / Tips (Documentos Múltiples CRUD Completo)
router.get('/', getConsejos);
router.post('/crear', [validarJWT], createConsejo);
router.put('/editar/:id', [validarJWT], updateConsejo);
router.delete('/borrar/:id', [validarJWT], deleteConsejo);

export default router;