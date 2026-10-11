import Usuario from '../models/usuario';
import Profile from '../models/profile';
import MaterialReciclado from '../models/material';

export const actualizarImagen = async (
    tipo: string, 
    id: string, 
    nombreArchivo: string, 
    campoDestino: string | null = null
): Promise<boolean> => {

    switch (tipo) {
        case 'usuarios':
            const usuario = await Usuario.findById(id);
            if (!usuario) {
                console.log('No se encontró el usuario por ID');
                return false;
            }
            // Si tu modelo de usuario guarda una propiedad img, la actualiza aquí
            // En arquitecturas con perfil separado, suele guardarse en la colección Profile
            return true;

        case 'perfiles':
            const perfil = await Profile.findOne({ usuario: id as any });
            if (!perfil) {
                console.log('No se encontró un perfil para este usuario');
                return false;
            }
            perfil.avatar_url = nombreArchivo;
            perfil.updatedAt = new Date();
            await perfil.save();
            return true;

        case 'materiales':
            const material = await MaterialReciclado.findById(id);
            if (!material) {
                console.log('No se encontró el registro de material');
                return false;
            }
            // Agrega detalleOpcional o un campo de imagen si lo requieres en tu esquema
            (material as any).detalleOpcional = `Imagen de respaldo: ${nombreArchivo}`;
            material.updatedAt = new Date();
            await material.save();
            return true;

        default:
            return false;
    }
};
