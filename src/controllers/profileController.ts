import { Request, Response } from 'express';
import Profile from '../models/profile';
import Familiar from '../models/familiares'; 


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
 * 📝 Actualizar la información personal del perfil (Creación automática al vuelo integrada)
 */
export const actualizarPerfil = async (req: Request, res: Response) => {
    const usuarioId = req.uid;
    const { first_name, last_name, phone_office, phone_mobile, avatar_url, pais, ciudad } = req.body;

    try {
        // 1. Buscamos el perfil que le pertenece al usuario autenticado en Atlas
        let perfilDB = await Profile.findOne({ usuario: usuarioId as any });

        // 🛡️ ACCIÓN AUTOMÁTICA EN CALIENTE: Si el perfil no existe, lo inicializamos de golpe
        if (!perfilDB) {
            console.log(`⚠️ No se encontró perfil para el UID [${usuarioId}]. Creando documento automático...`);
            
            perfilDB = new Profile({
                usuario: usuarioId,
                first_name: first_name || '',
                last_name: last_name || '',
                phone_office: phone_office || '',
                phone_mobile: phone_mobile || '',
                avatar_url: avatar_url || 'assets/images/default.jpeg',
                pais: pais || '',
                ciudad: ciudad || '',
                // Inicializamos los valores por defecto del concurso Mercadona / UCC para la rama gamificación
                puntos_acumulados: 0,
                rango: 'Pollito',
                createdAt: new Date()
            });

            // Guardamos el nuevo registro base en MongoDB Atlas
            await perfilDB.save();
            console.log(`✅ Perfil automático inicializado en Atlas con ID: ${perfilDB._id}`);
        }

        // 2. Estructuramos los campos a actualizar garantizando la persistencia de datos previos
        const camposActualizar = {
            first_name: first_name !== undefined ? first_name : perfilDB.first_name,
            last_name: last_name !== undefined ? last_name : perfilDB.last_name,
            phone_office: phone_office !== undefined ? phone_office : perfilDB.phone_office,
            phone_mobile: phone_mobile !== undefined ? phone_mobile : perfilDB.phone_mobile,
            avatar_url: avatar_url !== undefined ? avatar_url : perfilDB.avatar_url,
            pais: pais !== undefined ? pais : perfilDB.pais,
            ciudad: ciudad !== undefined ? ciudad : perfilDB.ciudad,
            updatedAt: new Date()
        };

        // 3. Ejecutamos la actualización segura sobre el documento garantizado
        const perfilActualizado = await Profile.findOneAndUpdate(
            { usuario: usuarioId as any },
            camposActualizar,
            { new: true } // Para que devuelva el objeto modificado en la respuesta
        ).populate('usuario', 'username email'); // Opcional: por si tu Front necesita el join del login al vuelo

        return res.json({
            ok: true,
            msg: 'Perfil actualizado con éxito',
            perfil: perfilActualizado
        });

    } catch (error: any) {
        console.error('❌ Error crítico al procesar la actualización del perfil:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno al actualizar el perfil en el servidor'
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

