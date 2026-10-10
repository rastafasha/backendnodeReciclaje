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
