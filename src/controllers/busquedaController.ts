import { Request, Response } from 'express';
import Usuario from '../models/usuario';
import Comunicado from '../models/comunicado';

/**
 * 🔍 OBTENER BÚSQUEDA GLOBAL UNIFICADA
 * GET /api/todo/:busqueda
 */
export const getTodo = async (req: Request, res: Response): Promise<Response> => {
    // 🟢 CORRECCIÓN: Forzamos el casteo estricto a string para que RegExp no se queje
    const busqueda = req.params.busqueda as string;
    const regex = new RegExp(busqueda, 'i');

    try {
        const [participantes, cartelera] = await Promise.all([
            Usuario.find({
                role: 'USER',
                $or: [{ username: regex }, { email: regex }, { identificacion: regex }]
            }).select('-password'),

            Comunicado.find({
                $or: [{ titulo: regex }, { mensaje: regex }, { tipo: regex }]
            }).populate('creado_por', 'username email')
        ]);

        return res.json({
            ok: true,
            participantes,
            cartelera
        });
    } catch (error: any) {
        console.error('❌ Error en búsqueda global:', error);
        return res.status(500).json({ ok: false, msg: 'Error interno en el pipeline de búsqueda' });
    }
};

/**
 * 🎯 OBTENER BÚSQUEDA SEGMENTADA POR COLECCIÓN
 * GET /api/todo/coleccion/:tabla/:busqueda
 */
export const getDocumentosColeccion = async (req: Request, res: Response): Promise<Response> => {
    const tabla = req.params.tabla as string;
    // 🟢 CORRECCIÓN: Forzamos el casteo estricto a string aquí también
    const busqueda = req.params.busqueda as string;
    const regex = new RegExp(busqueda, 'i');

    try {
        let data: any = [];

        switch (tabla) {
            case 'usuarios':
            case 'participantes':
                data = await Usuario.find({
                    role: 'USER',
                    $or: [{ username: regex }, { email: regex }, { identificacion: regex }]
                }).select('-password');
                break;

            case 'comunicados':
            case 'cartelera':
                data = await Comunicado.find({
                    $or: [{ titulo: regex }, { mensaje: regex }, { tipo: regex }]
                }).populate('creado_por', 'username email');
                break;

            default:
                return res.status(400).json({ ok: false, msg: 'Colección o tabla no válida en el ecosistema eco-tech.' });
        }

        return res.json({ ok: true, resultados: data });

    } catch (error: any) {
        console.error("❌ ERROR EN BUSQUEDA MODULAR:", error);
        return res.status(500).json({ ok: false, msg: 'Error al buscar en la colección seleccionada' });
    }
};