import { Request, Response } from 'express';
import Profile from '../models/profile';

/**
 * 👤 Obtener el perfil del usuario autenticado (mediante el token)
 */
export const getMiPerfil = async (req: Request, res: Response) => {
    const usuarioId = req.uid; // Extraído de forma segura desde validarJWT

    try {
        // Buscamos el perfil asociado al ID del usuario y lo populamos con las credenciales
        const perfil = await Profile.findOne({ usuario: usuarioId as any })
            .populate('usuario', 'username email role google');

        if (!perfil) {
            return res.status(404).json({
                ok: false,
                msg: 'Perfil no encontrado para este usuario'
            });
        }

        return res.json({
            ok: true,
            perfil
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al obtener los datos del perfil'
        });
    }
};

/**
 * 📝 Actualizar la información personal del perfil
 */
export const actualizarPerfil = async (req: Request, res: Response) => {
    const usuarioId = req.uid;
    const { first_name, last_name, phone, avatar_url, pais, ciudad } = req.body;

    try {
        // Buscamos el perfil que le pertenece al usuario autenticado
        const perfilDB = await Profile.findOne({ usuario: usuarioId as any });

        if (!perfilDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontró un perfil asociado a su cuenta'
            });
        }

        // Estructuramos los campos a actualizar protegiendo que no alteren los puntos por aquí
        const camposActualizar = {
            first_name: first_name || perfilDB.first_name,
            last_name: last_name || perfilDB.last_name,
            phone: phone || perfilDB.phone,
            avatar_url: avatar_url || perfilDB.avatar_url,
            pais: pais || perfilDB.pais,
            ciudad: ciudad || perfilDB.ciudad,
            updatedAt: new Date()
        };

        const perfilActualizado = await Profile.findOneAndUpdate(
            { usuario: usuarioId as any },
            camposActualizar,
            { new: true } // Para que devuelva el objeto modificado en la respuesta
        );

        return res.json({
            ok: true,
            msg: 'Perfil actualizado con éxito',
            perfil: perfilActualizado
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno al actualizar el perfil'
        });
    }
};

/**
 * ♻️ Función auxiliar interna/admin para sumar o restar puntos al perfil del usuario
 */
export const actualizarPuntosPerfil = async (usuarioId: string, puntosASumar: number) => {
    try {
        const perfil = await Profile.findOne({ usuario: usuarioId as any });
        
        if (!perfil) {
            console.error(`⚠️ No se encontró perfil para sumar puntos al usuario: ${usuarioId}`);
            return null;
        }

        perfil.puntos_totales += puntosASumar;
        perfil.puntos_actuales += puntosASumar;
        perfil.updatedAt = new Date();

        await perfil.save();
        return perfil;
    } catch (error: any) {
        console.error('💥 Error al actualizar los puntos en el perfil:', error.message);
        return null;
    }
};
