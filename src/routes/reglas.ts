import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { getReglas, updateReglas } from '../controllers/reglasController';
import { validarJWT } from '../middlewares/validar-jwt'; // Ajusta la ruta a tu carpeta
import { validarCampos } from '../middlewares/validar-campos'; // Ajusta la ruta a tu carpeta

const router = Router();

/**
 * Middleware local para restringir accesos al Admin CRM
 * Valida que el rol inyectado por el JWT sea el permitido
 */
const validarAdmin = (req: Request, res: Response, next: NextFunction) => {
  const rolesPermitidos = ['SUPERADMIN', 'ADMIN']; // Ajusta según tus nombres de rol
  
  if (!req.role || !rolesPermitidos.includes(req.role)) {
    return res.status(403).json({
      ok: false,
      msg: 'No tienes privilegios de administrador para realizar esta acción'
    });
  }
  next();
};

// ==========================================
// 📱 Endpoint Público (Consumido por la PWA celular)
// ==========================================
router.get('/', getReglas);

// ==========================================
// 🔌 Endpoint Privado (Consumido por el Admin CRM)
// ==========================================
router.put(
  '/reglas',
  [
    validarJWT,       // 1. Verifica que la sesión exista y sea válida
    validarAdmin,     // 2. Filtra que el rol sea administrativo
    // 3. express-validator sanitiza la entrada en el servidor lógico
    body('diasRequeridos', 'El número de días es obligatorio y debe ser un entero').isInt({ min: 1 }),
    body('primerLugar', 'El texto para el primer lugar es obligatorio').notEmpty().trim(),
    body('segundoLugar', 'El texto para el segundo lugar es obligatorio').notEmpty().trim(),
    body('tercerLugar', 'El texto para el tercer lugar es obligatorio').notEmpty().trim(),
    validarCampos     // 4. Ataja cualquier error de validación antes del controlador
  ],
  updateReglas
);

export default router;
