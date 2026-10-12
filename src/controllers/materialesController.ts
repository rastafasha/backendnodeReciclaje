import { Request, Response } from 'express';
import AvanceDiario from '../models/avanceDiario';

/**
 * 📈 Registrar una entrega de material mediante HTTP POST
 */
export const crearEntregaMaterial = async (req: Request, res: Response) => {
    const usuarioId = req.uid; 
    const { comida, categoria, nombreItem, descripcion } = req.body;

    // Generamos la fecha del día actual en formato YYYY-MM-DD según la zona horaria del servidor
    const hoy = new Date();
    const fechaString = hoy.toISOString().split('T')[0]; 

    try {
        // 1. Validar si ya registró esa comida hoy antes de intentar insertar
        const existeRegistro = await AvanceDiario.findOne({
            usuario: usuarioId as any,
            comida,
            fechaString
        });

        if (existeRegistro) {
            return res.status(400).json({
                ok: false,
                msg: `Ya has registrado tu ${comida.toLowerCase()} el día de hoy. ¡Continúa con la siguiente comida! 🍽️`
            });
        }

        // 2. Crear el nuevo avance diario de racha
        const nuevoAvance = new AvanceDiario({
            usuario: usuarioId,
            comida,
            categoria,
            nombreItem,
            descripcion,
            fechaString,
            puntosOtorgados: 1 // Regla Coggle: 1 punto por comida
        });

        await nuevoAvance.save();

        return res.status(201).json({
            ok: true,
            msg: '¡Hábito diario registrado con éxito! +1 Punto 🎉',
            avance: nuevoAvance
        });

    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno al procesar tu avance diario'
        });
    }
};

/**
 * 📜 Obtener el historial completo de reciclaje del usuario autenticado
 */
export const getHistorialUsuario = async (req: Request, res: Response) => {
    const usuarioId = req.uid; // Es un string | undefined

    if (!usuarioId) {
        return res.status(400).json({
            ok: false,
            msg: 'No se encontró el identificador del usuario en el token'
        });
    }

    try {
        // Buscamos los materiales ordenados del más reciente al más antiguo
        const historial = await AvanceDiario.find({ usuario: usuarioId as any })
            .sort({ createdAt: -1 });

        return res.json({
            ok: true,
            totalRegistros: historial.length,
            historial
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al obtener el historial de reciclaje'
        });
    }
};

/**
 * 📊 Obtener estadísticas generales de reciclaje (Para pantallas de Admin o Dashboards)
 */
export const getEstadisticasGlobales = async (req: Request, res: Response) => {
    try {
        // Trae los últimos 20 registros de todo el sistema e incluye el nombre del usuario
        const ultimosRegistros = await AvanceDiario.find()
            .populate('usuario', 'username email')
            .sort({ createdAt: -1 })
            .limit(20);

        return res.json({
            ok: true,
            registros: ultimosRegistros
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al procesar las estadísticas de reciclaje'
        });
    }
};
