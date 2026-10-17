import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { v2 as cloudinary } from 'cloudinary';
import { UploadedFile } from 'express-fileupload';
import { actualizarImagen } from '../helpers/actualizar-imagen';

// Configuración de Cloudinary (Usa tus variables de entorno)
cloudinary.config({
    api_key: process.env.API_KEY_CLOUDINARY,
    api_secret: process.env.API_SECRET_CLOUDINARY,
    cloud_name: process.env.CLOUD_NAME
});

export const fileUpload = async (req: Request, res: Response) => {
    const { tipo, id } = req.params as { tipo: string; id: string }

    // 1. Validar las colecciones válidas de tu App de Reciclaje
    const tiposValidos = ['usuarios', 'perfiles', 'materiales', 'avances'];
    if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ ok: false, msg: 'Tipo de colección no permitido' });
    }

    // 2. Validar que venga un archivo en la petición
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ ok: false, msg: 'No se seleccionó ninguna imagen' });
    }

    // Casteamos el archivo al tipo nativo de express-fileupload
    const file = req.files.imagen as UploadedFile;

    // 3. Validación estricta de tamaño (3MB)
    const MAX_SIZE_MB = 3;
    const bytesLimit = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > bytesLimit) {
        return res.status(400).json({
            ok: false,
            msg: `La imagen supera el límite de ${MAX_SIZE_MB}MB. Por favor, sube una más ligera.`
        });
    }

    // 4. Validar extensión permitida
    const nombreCortado = file.name.split('.');
    const extensionArchivo = nombreCortado[nombreCortado.length - 1].toLowerCase();
    const extensionesValidas = ['png', 'jpg', 'jpeg', 'gif', 'webp'];

    if (!extensionesValidas.includes(extensionArchivo)) {
        return res.status(400).json({ ok: false, msg: 'Formato no permitido (usa jpg, png o webp)' });
    }

    try {
        // 5. Convertir el Buffer a Data URI en memoria para Render
        const base64Image = Buffer.from(file.data).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${base64Image}`;

        // 6. Subir a tu nube de Cloudinary con transformaciones automáticas
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: `appreciclaje/uploads/${tipo}/`,
            public_id: uuidv4(),
            transformation: [
                { width: 1000, crop: "limit" },
                { quality: "auto" },
                { fetch_format: "auto" }
            ]
        });

       


        const urlImagen = result.secure_url;
        const campoDestino = (req.query.campo as string) || null;

        // 7. Actualizar la referencia en la base de datos distribuida
        const dbActualizada = await actualizarImagen(tipo, id, urlImagen, campoDestino);
        
         // 7. Actualizar la referencia en la base de datos distribuida
        if (tipo === 'avances') {
            // 🎯 BYPASS: Como es un avance, no actualizamos base de datos todavía.
            // Solo le retornamos la URL a Ionic para que la use el controlador de Gemini.
            return res.json({
                ok: true,
                msg: 'Imagen de avance subida y optimizada con éxito 🎉',
                nombreArchivo: urlImagen // Retorna la URL de Cloudinary
            });
        }

        if (!dbActualizada) {
            return res.status(400).json({ ok: false, msg: 'No se pudo asociar la imagen al registro' });
        }

        return res.json({
            ok: true,
            msg: 'Imagen subida y optimizada con éxito en Cloudinary 🎉',
            nombreArchivo: urlImagen
        });

    } catch (error: any) {
        console.error('Error Cloudinary TS:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Hubo un error al procesar la imagen en el servidor',
            error: error.message
        });
    }
};

/**
 * 🔗 Retorna la URL directa procesada desde Cloudinary con Redimensionamiento dinámico
 */
export const retornaImagen = (req: Request, res: Response) => {
    // 🚀 Forzamos a TypeScript a tratar req.params como un objeto con strings puros
    const { foto } = req.params as { foto: string };

    // Ahora sí te dejará pasarle 'foto' a Cloudinary sin ningún error de asignación
    const urlImg = cloudinary.url(foto, {
        width: 300,
        height: 300,
        crop: 'fill'
    });

    return res.json({
        ok: true,
        url: urlImg
    });
};