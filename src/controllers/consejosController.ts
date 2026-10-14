import { Request, Response } from 'express';
import {TipEcologico} from '../models/tipEcologico';
import { enviarNotificacionPushGlobal } from './pushController'; // Tu disparador WebPush que ya calibraste

/**
 * 📋 GET: Obtener todos los consejos registrados (Ordenados por el más reciente)
 * Consumido por el Admin para listar la tabla y por la PWA para el Home
 */
export const getConsejos = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Usamos .lean() para recuperar objetos JSON planos ultra rápidos desde Atlas
    const consejos = await TipEcologico.find().sort({ createdAt: -1 }).lean();
    
    res.status(200).json({
      ok: true,
      data: consejos
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al obtener los consejos de reciclaje', error });
  }
};

/**
 * ➕ POST: Crear una nueva píldora ecológica individual
 * Disparado desde el Admin CRM - Gatilla WebPush Automático si se publica activo
 */
export const createConsejo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { titulo, descripcion, activo } = req.body;

    const nuevoConsejo = new TipEcologico({
      titulo,
      descripcion,
      activo: activo !== undefined ? activo : true
    });

    await nuevoConsejo.save();

    // 🚀 GATILLO WEBPUSH AUTOMÁTICO EN SEGUNDO PLANO
    // Si el consejo se publica en estado visible (activo), le revienta el globo al participante al instante
    if (nuevoConsejo.activo) {
      const tituloPush = '💡 ¡Nuevo Tip Ecológico!';
      const mensajePush = `Descubre la píldora de hoy: "${titulo}". ¡Mantén tu racha verde! ♻️`;
      
      // Invocamos tu motor VAPID que ya dejamos funcionando en remoto
      await enviarNotificacionPushGlobal(tituloPush, mensajePush, '/notificaciones', 'TIPS');
    }

    res.status(201).json({
      ok: true,
      message: '¡Consejo ecológico publicado con éxito! ✨',
      data: nuevoConsejo
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al crear el consejo desde el CRM', error });
  }
};

/**
 * ✏️ PUT: Actualizar un consejo ecológico existente por su ID
 * /api/comunicados/consejos-editar/:id
 */
export const updateConsejo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Captura el identificador desde la URL de la ruta
    const { titulo, descripcion, activo } = req.body;

    const consejoActualizado = await TipEcologico.findByIdAndUpdate(
      id,
      { titulo, descripcion, activo, actualizadoEn: new Date() },
      { new: true } // Devuelve el documento ya mutado de Atlas
    );

    if (!consejoActualizado) {
      res.status(404).json({ ok: false, msg: 'No se encontró el tip solicitado en la base de datos.' });
      return;
    }

    res.status(200).json({
      ok: true,
      message: '¡Píldora ambiental actualizada con éxito! 🚀',
      data: consejoActualizado
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al actualizar el consejo', error });
  }
};

/**
 * 🗑️ DELETE: Eliminar permanentemente un tip ecológico por su ID
 * /api/comunicados/consejos-borrar/:id
 */
export const deleteConsejo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const consejoBorrado = await TipEcologico.findByIdAndDelete(id);

    if (!consejoBorrado) {
      res.status(404).json({ ok: false, msg: 'El ID solicitado no existe en Atlas.' });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'El consejo fue removido permanentemente de MongoDB Atlas. 🧹'
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error al eliminar el consejo', error });
  }
};