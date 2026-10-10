import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayloadCustom {
  sub?: string;
  uid?: string;
  role?: string;
}

export const validarJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({
      ok: false,
      msg: 'No hay token en la petición'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    
    // Verificación forzando el algoritmo compartido
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayloadCustom;

    const userId = payload.sub || payload.uid;
    const userRole = payload.role || 'SUPERADMIN'; // O tu rol por defecto de seguridad

    if (!userId) {
      return res.status(401).json({
        ok: false,
        msg: 'Token inválido: Identificador de usuario ausente en el payload'
      });
    }

    // Inyección segura gracias al archivo src/types/index.d.ts
    req.uid = String(userId).trim(); 
    req.role = String(userRole).toUpperCase().trim();

    console.log(`🔑 [NODE AUTH TS] Token validado. Usuario: ${req.uid} | Rol: ${req.role}`);
    next();

  } catch (error: any) {
    console.error('🚨 [NODE AUTH ERROR TS] Falló la desencriptación:', error.message);
    return res.status(401).json({
      ok: false,
      msg: 'Token no válido o expirado'
    });
  }
};
