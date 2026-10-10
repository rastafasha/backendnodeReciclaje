import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario';
import Profile from '../models/profile';

/**
 * 📋 Obtener lista paginada de usuarios
 */
export const getUsuariosList = async (req: Request, res: Response) => {
    try {
        const desde = Number(req.query.desde) || 0;

        const [usuarios, total] = await Promise.all([
            Usuario.find({}, 'username email role google createdAt')
                .skip(desde)
                .limit(5),
            Usuario.countDocuments()
        ]);

        return res.json({
            ok: true,
            usuarios,
            total
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error inesperado al listar usuarios'
        });
    }
};

/**
 * 🆕 Crear un usuario común (USER)
 */
export const crearUsuarios = async (req: Request, res: Response) => { 
    const { email, password, username } = req.body;

    try {
        const existeEmail = await Usuario.findOne({ email });
        if (existeEmail) {
            return res.status(400).json({ ok: false, msg: 'El correo ya está registrado' });
        }

        // 1. Instanciar el usuario
        const usuario = new Usuario(req.body);

        // 2. Encriptar contraseña
        const salt = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync(password, salt);

        // 3. Crear el perfil en blanco enlazado a este usuario
        const nuevoPerfil = new Profile({
            usuario: usuario._id,
            first_name: username, // Usamos el username como nombre inicial
            puntos_totales: 0,
            puntos_actuales: 0
        });

        // 4. Enlazar el perfil dentro del objeto usuario
        usuario.profile = nuevoPerfil._id as any;

        // 5. Guardar ambos documentos de manera atómica en MongoDB Atlas
        await Promise.all([
            usuario.save(),
            nuevoPerfil.save()
        ]);

        return res.json({
            ok: true,
            usuario,
            profile: nuevoPerfil
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: 'Error al crear el usuario y su perfil' });
    }
};

/**
 * 🛠️ Crear un usuario con rol de Editor
 */
export const crearEditor = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const existeEmail = await Usuario.findOne({ email });

        if (existeEmail) {
            return res.status(400).json({
                ok: false,
                msg: 'El correo ya está registrado'
            });
        }

        const usuario = new Usuario(req.body);
        usuario.role = 'EDITOR';

        const salt = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync(password, salt);

        await usuario.save();

        return res.json({
            ok: true,
            usuario
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al crear el editor'
        });
    }
};

/**
 * 🔄 Actualizar perfil de usuario regular
 */
export const actualizarUsuario = async (req: Request, res: Response) => {
    const uid = req.params.id;

    try {
        const usuarioDB = await Usuario.findById(uid);

        if (!usuarioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe un usuario con ese id'
            });
        }

        // Campos a actualizar excluyendo validaciones de Google y Password por esta ruta
        const { password, google, email, ...campos } = req.body;

        if (usuarioDB.email !== email) {
            const existeEmail = await Usuario.findOne({ email });
            if (existeEmail) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Ya existe un usuario con ese email'
                });
            }
        }

        if (!usuarioDB.google) {
            campos.email = email;
        } else if (usuarioDB.email !== email) {
            return res.status(400).json({
                ok: false,
                msg: 'Usuarios de Google no pueden cambiar su correo'
            });
        }

        campos.updatedAt = new Date();
        const usuarioActualizado = await Usuario.findByIdAndUpdate(uid, campos, { new: true });

        return res.json({
            ok: true,
            usuario: usuarioActualizado
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al actualizar usuario'
        });
    }
};

/**
 * 👑 Actualizar campos administrativos (Admin / SuperAdmin)
 */
export const actualizarUAdmin = async (req: Request, res: Response) => {
    const uid = req.params.id;

    try {
        const usuarioDB = await Usuario.findById(uid);

        if (!usuarioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        const { password, google, email, ...campos } = req.body;

        if (usuarioDB.email !== email) {
            const existeEmail = await Usuario.findOne({ email });
            if (existeEmail) {
                return res.status(400).json({
                    ok: false,
                    msg: 'El email ya pertenece a otra cuenta'
                });
            }
            campos.email = email;
        }

        campos.updatedAt = new Date();
        const usuarioActualizado = await Usuario.findByIdAndUpdate(uid, campos, { new: true });

        return res.json({
            ok: true,
            usuario: usuarioActualizado
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error administrativo al actualizar'
        });
    }
};

/**
 * 🗑️ Eliminar un usuario permanentemente
 */
export const borrarUsuario = async (req: Request, res: Response) => {
    const uid = req.params.id;

    try {
        const usuarioDB = await Usuario.findById(uid);

        if (!usuarioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'El usuario a eliminar no existe'
            });
        }

        await Usuario.findByIdAndDelete(uid);

        return res.json({
            ok: true,
            msg: 'Usuario eliminado correctamente de la base de datos'
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al borrar el usuario'
        });
    }
};

/**
 * 🔍 Obtener un único usuario por su ID
 */
export const getUsuario = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        // 🚀 Quitamos 'project' de la cadena del populate
        const usuario = await Usuario.findById(id).populate('profile');
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }
        return res.json({ ok: true, usuario });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: 'Error al buscar el usuario' });
    }
};

/**
 * 👥 Obtener todos los usuarios sin paginación
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const usuarios = await Usuario.find({}, 'username email role createdAt');
        return res.json({
            ok: true,
            usuarios
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al obtener el universo de usuarios'
        });
    }
};

/**
 * ✨ Obtener los últimos usuarios creados recientes
 */
export const newest = async (req: Request, res: Response) => {
    try {
        const usuarios = await Usuario.find().sort({ createdAt: -1 }).limit(5);
        return res.json({
            ok: true,
            usuarios
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al obtener usuarios recientes'
        });
    }
};

/**
 * 🔒 Iniciar proceso de recuperación de contraseña (Token Recovery)
 */
export const set_token_recovery = async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
        // Aquí agregarías tu lógica para generar un código/token aleatorio y guardarlo en la DB
        return res.json({
            ok: true,
            msg: `Token de recuperación generado para ${email}`
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, msg: 'Error de recuperación' });
    }
};

/**
 * 🔑 Verificar el token de recuperación provisto por el usuario
 */
export const verify_token_recovery = async (req: Request, res: Response) => {
    const { email, codigo } = req.params;
    try {
        // Lógica de comparación de tokens temporales
        return res.json({
            ok: true,
            msg: 'Token verificado exitosamente'
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, msg: 'Error al verificar token' });
    }
};

/**
 * 🔄 Consolidar el cambio de contraseña definitivo
 */
export const change_password = async (req: Request, res: Response) => {
    const { email } = req.params;
    const { password } = req.body;
    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }

        const salt = bcrypt.genSaltSync();
        usuario.password = bcrypt.hashSync(password, salt);
        usuario.updatedAt = new Date();

        await usuario.save();

        return res.json({
            ok: true,
            msg: 'Contraseña cambiada con éxito'
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, msg: 'Error al cambiar la contraseña' });
    }
};

/**
 * 📝 Listar únicamente usuarios que tengan rol EDITOR
 */
export const getAllEditores = async (req: Request, res: Response) => {
    try {
        const editores = await Usuario.find({ role: 'EDITOR' });
        return res.json({
            ok: true,
            editores
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, msg: 'Error al listar editores' });
    }
};
/**
• 🖼️ Listar información asociada al perfil detallado del usuario
*/
export const listarProfileUsuario = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const usuario = await Usuario.findById(id).populate('profile');
        return res.json({
            ok: true,
            profile: usuario ? usuario.profile : null
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, msg: 'Error al obtener perfil' });
    }
};
/**
• 🏅 Convertir un registro regular a rol de Miembro verificado
*/
export const cambiarAMiembro = async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(id, { role: 'MEMBER', updatedAt: new Date() }, { new: true });
        return res.json({
            ok: true,
            usuario: usuarioActualizado
        });
    } catch (error: any) {
        return res.status(500).json({ ok: false, msg: 'Error al cambiar rol a miembro' });
    }
};
/**
• 🏷️ Modificar explícitamente el rol de un usuario (Admin task)
*/
export const actualizarUsuarioRole = async (req: Request, res: Response) => {
    const uid = req.params.id;
    const { role } = req.body; try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(uid, { role, updatedAt: new Date() }, { new: true });
        if (!usuarioActualizado) {
            return res.status(404).json({ ok: false, msg: 'Usuario no encontrado' });
        }
        return res.json({
            ok: true,
            usuario: usuarioActualizado
        });
    } catch (error: any) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error al actualizar el rol del usuario'
        });
    }
};