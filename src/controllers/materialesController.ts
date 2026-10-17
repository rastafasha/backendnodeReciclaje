import { Request, Response } from 'express';
import AvanceDiario from '../models/avanceDiario';
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
/**
 * 📈 Registrar una entrega de material mediante HTTP POST (Auditado por IA)
 */
export const crearEntregaMaterial = async (req: Request, res: Response) => {
    const usuarioId = req.uid; // Extraído de forma segura desde tu middleware de JWT
    
    // 📸 Recibimos también la URL comprimida de Cloudinary enviada desde la PWA móvil
    const { comida, categoria, nombreItem, descripcion, urlFotoCloudinary } = req.body;

    // Generamos la fecha del día actual en formato YYYY-MM-DD según la zona horaria del servidor
    const hoy = new Date();
    const fechaString = hoy.toISOString().split('T')[0];

    // Validación de seguridad por si la PWA olvidó capturar o mandar la evidencia fotográfica
    if (!urlFotoCloudinary) {
        return res.status(400).json({
            ok: false,
            msg: 'La evidencia fotográfica de Cloudinary es totalmente requerida para validar el hábito.'
        });
    }

    try {
        // 1. Validar si ya registró esa comida hoy antes de gastar recursos de la IA
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

        // 🧠 2. PREPARAR AUDITORÍA VISUAL CON GEMINI 2.5 FLASH
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" } // Forzamos un JSON estructurado de salida
        });

        // Descarga optimizada en buffer de la imagen pre-comprimida en Cloudinary
        const responseImagen = await fetch(urlFotoCloudinary);
        const bufferImagen = await responseImagen.arrayBuffer();
        
        const fotoParaIA = {
            inlineData: {
                data: Buffer.from(bufferImagen).toString("base64"),
                mimeType: "image/jpeg"
            },
        };

        // Prompt estricto basado en tus enums del Coggle/Figma
        const promptDefinitivo = `
            Actúas como un auditor estricto de IA para una app de reciclaje y nutrición en Catalunya. 
            El usuario reporta en el bloque de comida "${comida}" la categoría alimenticia "${categoria}".
            Nombre del plato/residuo: "${nombreItem}". Descripción redactada por el usuario: "${descripcion}".
            
            Analiza detenidamente la fotografía adjunta. Determina si corresponde de forma legítima a comida, platos o residuos que encajen dentro de la categoría especificada.
            
            Debes responder ESTRICTAMENTE con este formato JSON:
            {
                "valido": true o false,
                "motivo": "Explicación muy breve en español de por qué se aprobó o rechazó"
            }
            Si la foto no tiene relación alguna con comida/reciclaje, es borrosa, es una pantalla en negro o es un fraude evidente, pon "valido": false.
        `;

        // Ejecutar el análisis en los servidores de Google
        const resultadoIA = await model.generateContent([promptDefinitivo, fotoParaIA]);
        const respuestaJSON = JSON.parse(resultadoIA.response.text());

        const aprobado = respuestaJSON.valido === true;
        const estadoValidacion = aprobado ? 'APROBADO' : 'RECHAZADO';
        
        // 🎯 Aplicamos tu Regla Coggle: 1 punto si la IA aprueba la legitimidad, 0 si detecta trampa
        const puntos = aprobado ? 1 : 0; 

        // 3. Crear el nuevo avance diario de racha incluyendo los datos de la auditoría
        const nuevoAvance = new AvanceDiario({
            usuario: usuarioId,
            comida,
            categoria,
            nombreItem,
            descripcion,
            fechaString,
            puntosOtorgados: puntos, // Asignación dinámica basada en el veredicto
            fotoUrl: urlFotoCloudinary,
            estado: estadoValidacion,
            motivoIA: respuestaJSON.motivo
        });

        await nuevoAvance.save();

        // 4. Respuesta en espejo adaptada a los resultados de la IA
        if (!aprobado) {
            return res.status(200).json({
                ok: false,
                msg: `Hábito rechazado por la IA: ${respuestaJSON.motivo} ⛔ (Suma 0 puntos).`,
                avance: nuevoAvance
            });
        }

        return res.status(201).json({
            ok: true,
            msg: '¡Hábito diario validado por la IA y registrado con éxito! +1 Punto 🎉',
            avance: nuevoAvance
        });

    } catch (error: any) {
        console.error('❌ Error en el proceso de auditoría o inserción:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno al procesar tu avance diario auditado por IA'
        });
    }
};

/**
 * 📜 Obtener el historial completo de reciclaje del usuario autenticado
 */
export const getHistorialUsuario = async (req: Request, res: Response) => {
    const usuarioId = req.uid;

    if (!usuarioId) {
        return res.status(400).json({
            ok: false,
            msg: 'No se encontró el identificador del usuario en el token'
        });
    }

    try {
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