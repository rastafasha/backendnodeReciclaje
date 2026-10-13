import { Request, Response } from 'express';
import Notificacion from '../models/notificacion';

export const getNotificacionesPendientes = async (req: Request, res: Response) => {
    const usuarioId = req.uid;
    try {
        const alertas = await Notificacion.find({ usuario: usuarioId as any, leido: false })
            .sort({ createdAt: -1 })
            .limit(20);
        return res.json({ ok: true, alertas });
    } catch (error) {
        return res.status(500).json({ ok: false, msg: 'Error al obtener notificaciones pendientes.' });
    }
};

export const marcarLeida = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await Notificacion.findByIdAndUpdate(id, { leido: true });
        return res.json({ ok: true, msg: 'Notificación marcada como leída.' });
    } catch (error) {
        return res.status(500).json({ ok: false, msg: 'Error al actualizar estado.' });
    }
};

/**
 * 🧹 MARCAR TODAS LAS NOTIFICACIONES DEL USUARIO COMO LEÍDAS
 * PUT /api/notificaciones/marcar-todas-leidas
 */
export const marcarTodasComoLeidas = async (req: Request, res: Response): Promise<Response> => {
  // Extraemos de forma segura el uid inyectado por tu middleware validarJWT
  const uid = req.uid;

  try {
    // Buscamos todas las alertas de este usuario que estén pendientes y las actualizamos
    const resultado = await Notificacion.updateMany(
      { usuario: uid as any, leido: false },
      { $set: { leido: true } }
    );

    return res.status(200).json({
      ok: true,
      msg: 'Todas las notificaciones se marcaron como leídas de forma masiva.',
      modificadas: resultado.modifiedCount // Total de registros limpiados en Atlas
    });

  } catch (error: any) {
    console.error('❌ Error masivo en marcarTodasComoLeidas:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno en el servidor al intentar limpiar la bandeja.',
      error: error.message
    });
  }
};

/**
 * 📚 OBTENER HISTORIAL DE NOTIFICACIONES LEÍDAS (PAGINADO)
 * GET /api/notificaciones/leidas?desde=X
 */
export const getNotificacionesLeidas = async (req: Request, res: Response) => {
    // El uid ya viene inyectado de forma segura por el middleware validarJWT
    const usuarioId = req.uid;
    
    // Capturamos el inicio de la paginación desde la query string (por defecto 0)
    const desde = Number(req.query.desde) || 0;

    try {
        // Ejecutamos ambas consultas en paralelo para ahorrar tiempos de respuesta en Atlas
        const [alertas, total] = await Promise.all([
            Notificacion.find({ usuario: usuarioId as any, leido: true })
                .sort({ createdAt: -1 }) // Primero las más recientes que leyó
                .skip(desde)
                .limit(20), // Bloques cómodos de 20 en 20 para el scroll del celular
            Notificacion.countDocuments({ usuario: usuarioId as any, leido: true })
        ]);

        return res.json({ 
            ok: true, 
            alertas,
            total 
        });
    } catch (error) {
        console.error('❌ Error en getNotificacionesLeidas:', error);
        return res.status(500).json({ 
            ok: false, 
            msg: 'Error al recuperar el historial de notificaciones leídas.' 
        });
    }
};
