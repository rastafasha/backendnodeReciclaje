import { Request, Response } from 'express';
import Comunicado from '../models/comunicado'; 
import Notificacion from '../models/notificacion';
import SuscripcionPush from '../models/suscripcionPush';
import Usuario from '../models/usuario'; 
import { enviarNotificacionPushGlobal } from './pushController'; // Tu motor enviador real

/**
 * 📊 1. CONTAR NOTIFICACIONES NO LEÍDAS (Para el Badge del Navbar)
 * GET /api/comunicados/pendientes-conteo
 */
export const contarNotificacionesPendientes = async (req: Request, res: Response): Promise<Response> => {
  const uid = req.uid; // Inyectado por tu middleware validarJWT
  try {
    const total = await Notificacion.countDocuments({ usuario: uid as any, leido: false });
    return res.json({ ok: true, total });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: 'Error al contar notificaciones', error: error.message });
  }
};

/**
 * 📋 2. OBTENER COMUNICADOS (Para la Cartelera de los Participantes)
 * GET /api/comunicados/mis-comunicados
 */
export const obtenerMisComunicados = async (req: Request, res: Response): Promise<Response> => {
  const pagina = Number(req.query.page) || 1;
  const desde = (pagina - 1) * 10;

  try {
    const [comunicados, total] = await Promise.all([
      Comunicado.find()
        .sort({ createdAt: -1 })
        .skip(desde)
        .limit(10)
        .populate('creado_por', 'username email'),
      Comunicado.countDocuments()
    ]);

    return res.json({
      ok: true,
      comunicados,
      total,
      proximo: (desde + 10 < total) ? pagina + 1 : null
    });

  } catch (error: any) {
    console.error('❌ [ERROR EN CARTELERA BACKEND]:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno en el servidor',
      error: error.message
    });
  }
};

/**
 * 🚀 3. ENVIAR COMUNICADO GLOBAL (Acción del botón Publicar del Admin)
 * POST /api/comunicados/enviar-global
 */
export const enviarComunicadoGlobal = async (req: Request, res: Response): Promise<Response> => {
  const { titulo, mensaje, tipo, notificado_push } = req.body;
  const adminId = req.uid;

  try {
    // 1. Extraer el universo de usuarios con rol 'USER' (Tus participantes en competencia)
    const participantes = await Usuario.find({ role: 'USER' }).select('_id');
    const idsUsuarios = participantes.map(p => p._id.toString());

    if (idsUsuarios.length === 0) {
      return res.status(404).json({ ok: false, msg: 'No existen participantes registrados para recibir avisos.' });
    }

    // 2. Persistir el Comunicado físico en la colección 'comunicados'
    const nuevoComunicado = new Comunicado({
      titulo,
      mensaje, 
      tipo: tipo || 'CARTELERA',
      creado_por: adminId, 
      notificado_push: notificado_push || false
    });
    await nuevoComunicado.save();

    // 3. Inyectar masivamente en la cartelera/campana de alertas de la PWA (Polling/Historial)
    const registrosNotificaciones = idsUsuarios.map(uid => ({
      usuario: uid,
      titulo,
      mensaje,
      tipo: tipo === 'URGENTE' ? 'AVISO_GENERAL' : 'AVISO_GENERAL', // Homologa a tus tipos INotificacion
      leido: false
    }));
    await Notificacion.insertMany(registrosNotificaciones);

    // 4. Si el switch administrador fue activado, detonar el Motor WebPush Remoto en caliente
    if (notificado_push) {
      const urlDestino = '/tabs/historial'; // Ruta de destino en Ionic/PWA
      await enviarNotificacionPushGlobal(titulo, mensaje, urlDestino);
    }

    return res.json({ 
      ok: true, 
      msg: `Comunicado publicado y despachado a ${idsUsuarios.length} retadores con éxito. ♻️` 
    });

  } catch (error: any) {
    console.error('💥 [FALLO EN GATILLO GLOBAL PUSH]:', error);
    return res.status(500).json({ ok: false, msg: 'Error al procesar el envío masivo ambiental', error: error.message });
  }
};

/**
 * 🟠 4. MARCAR TODAS COMO LEÍDAS
 * PUT /api/comunicados/marcar-todas-leidas
 */
export const marcarTodasComoLeidas = async (req: Request, res: Response): Promise<Response> => {
  const uid = req.uid;
  try {
    const resultado = await Notificacion.updateMany(
      { usuario: uid as any, leido: false }, 
      { leido: true }
    );

    return res.json({
      ok: true,
      msg: 'Todas las notificaciones marcadas como leídas',
      modificadas: resultado.modifiedCount
    });
  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: 'Error al limpiar notificaciones', error: error.message });
  }
};