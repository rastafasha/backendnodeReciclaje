import { Request, Response } from 'express';
import Profile from '../models/profile';
import Familiar from '../models/familiares'; 


/**
 * 🆕 Crear y guardar un familiar independiente en Atlas
 */
export const agregarFamiliar = async (req: Request, res: Response) => {
    const usuarioId = req.uid; // Extraído por validarJWT
    const { nombre, apellido, parentesco } = req.body;

    try {
        // 1. Instanciamos el nuevo familiar inyectando el ID del usuario del token
        const nuevoFamiliar = new Familiar({
            usuario: usuarioId,
            nombre,
            apellido,
            parentesco
        });

        // 2. Guardamos físicamente en la nueva colección
        await nuevoFamiliar.save();

        return res.json({
            ok: true,
            msg: 'Familiar registrado con éxito',
            familiar: nuevoFamiliar
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno en el servidor al crear el familiar'
        });
    }
};

/**
 * 📋 Listar únicamente los familiares del usuario logueado
 */
export const obtenerFamiliares = async (req: Request, res: Response) => {
    const usuarioId = req.uid;

    try {
        // Buscamos todos los documentos que le pertenezcan a este usuario
        const familiares = await Familiar.find({ usuario: usuarioId as any  }).sort({ createdAt: -1 });

        return res.json({
            ok: true,
            familiares
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al listar los familiares'
        });
    }
};

/**
 * 🔄 Actualizar los datos de un familiar existente
 * PUT /api/perfiles/familiar/editar/:id
 */
export const actualizarFamiliar = async (req: Request, res: Response) => {
    const familiarId = req.params.id;
    const usuarioId = req.uid; // Extraído por validarJWT
    const { nombre, apellido, parentesco } = req.body;

    try {
        // 1. Verificamos que el familiar exista y sea propiedad del usuario logueado
        const familiarDB = await Familiar.findOne({ _id: familiarId, usuario: usuarioId as any });
        if (!familiarDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No se encontró el familiar o no tienes permisos para editarlo'
            });
        }

        // 2. Preparamos los campos y actualizamos
        const camposActualizar = {
            nombre: nombre || familiarDB.nombre,
            apellido: apellido || familiarDB.apellido,
            parentesco: parentesco || familiarDB.parentesco
        };

        const familiarActualizado = await Familiar.findByIdAndUpdate(
            familiarId,
            camposActualizar,
            { new: true }
        );

        return res.json({
            ok: true,
            msg: 'Familiar actualizado con éxito',
            familiar: familiarActualizado
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: 'Error al actualizar el familiar' });
    }
};

/**
 * 🗑️ Eliminar un familiar permanentemente de Atlas
 * DELETE /api/perfiles/familiar/borrar/:id
 */
export const borrarFamiliar = async (req: Request, res: Response) => {
    const familiarId = req.params.id;
    const usuarioId = req.uid;

    try {
        // Buscamos y borramos si coincide con el usuario del token
        const familiarEliminado = await Familiar.findOneAndDelete({ _id: familiarId, usuario: usuarioId as any});
        
        if (!familiarEliminado) {
            return res.status(404).json({
                ok: false,
                msg: 'El familiar a eliminar no existe o no tienes permisos'
            });
        }

        return res.json({
            ok: true,
            msg: 'Familiar eliminado correctamente de la base de datos'
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: 'Error al eliminar el familiar' });
    }
};