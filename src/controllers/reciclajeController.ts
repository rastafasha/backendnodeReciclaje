import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AvanceDiario from '../models/avanceDiario';
import { ProgresoReciclaje } from '../models/ProgresoReciclaje'; // Tu modelo de Mongoose

// Inicializamos Gemini con tu API Key (Sácala gratis de Google AI Studio)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const verificarYGuardarProgreso = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Recibimos los datos del frontend (La URL de Cloudinary y la info del usuario)
    const { usuarioId, categoria, descripcion, urlFotoCloudinary } = req.body;

    // 2. Configurar el modelo visual de Gemini (Gemini 2.5 Flash es ideal: rápido y económico)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Forzamos respuesta en JSON limpio
    });

    // 3. Descargar la imagen comprimida de Cloudinary internamente para pasársela a la IA
    const responseImagen = await fetch(urlFotoCloudinary);
    const bufferImagen = await responseImagen.arrayBuffer();
    
    const fotoParaIA = {
      inlineData: {
        data: Buffer.from(bufferImagen).toString("base64"),
        mimeType: "image/jpeg"
      },
    };

    // 4. El Prompt / Instrucción estricta anti-fraude
    const promptDefinitivo = `
      Actúas como un auditor estricto de IA para una app de reciclaje y nutrición. 
      El usuario seleccionó la categoría: "${categoria}" y escribió la siguiente descripción: "${descripcion}".
      
      Analiza la fotografía adjunta y determina si realmente corresponde a un desayuno/comida que contenga elementos de la categoría especificada.
      
      Debes responder ESTRICTAMENTE con este formato JSON:
      {
        "valido": true o false,
        "motivo": "Explicación muy breve de por qué se aprobó o rechazó"
      }
      Si la foto no tiene relación con comida, es borrosa, es un fondo negro/blanco o es un intento claro de fraude, pon "valido": false.
    `;

    // 5. Ejecutar el análisis visual
    const resultadoIA = await model.generateContent([promptDefinitivo, fotoParaIA]);
    const respuestaJSON = JSON.parse(resultadoIA.response.text());

    // 6. Lógica de Puntos basada en el veredicto de la IA
    let puntosAsignados = 0;
    let estadoValidacion = 'rechazado';

    if (respuestaJSON.valido === true) {
      puntosAsignados = 5; // Por ejemplo, 5 puntos por aporte válido
      estadoValidacion = 'aprobado';
    }

    // 7. Guardar en MongoDB Atlas
    const nuevoRegistro = await ProgresoReciclaje.create({
      usuarioId: usuarioId,
      categoria,
      descripcion,
      fotoUrl: urlFotoCloudinary,
      puntos: puntosAsignados,
      estado: 'pendiente',
      motivoIA: respuestaJSON.motivo,
      createdAt: new Date()
    });

    // Si fue aprobado, aquí disparas la suma de puntos en el perfil del usuario...

    // 8. Responder al Angular PWA
    res.status(200).json({
      ok: true,
      msg: estadoValidacion === 'aprobado' ? '¡Desayuno validado por la IA con éxito! 🎉' : 'Entrada rechazada por la IA ⛔',
      data: nuevoRegistro
    });

  } catch (error) {
    console.error('Error en auditoría IA:', error);
    res.status(500).json({ ok: false, msg: 'Error interno al procesar el análisis de la foto' });
  }
};




export const registrarAvanceConIA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { usuario, comida, categoria, nombreItem, descripcion, fechaString, urlFotoCloudinary } = req.body;

    // 1. Inicializar el modelo visual rápido y económico de Google
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // 2. Descargar la imagen optimizada de Cloudinary
    const responseImagen = await fetch(urlFotoCloudinary);
    const bufferImagen = await responseImagen.arrayBuffer();
    
    const fotoParaIA = {
      inlineData: {
        data: Buffer.from(bufferImagen).toString("base64"),
        mimeType: "image/jpeg"
      },
    };

    // 3. Prompt estricto mapeando tus tipos del Coggle
    const promptDefinitivo = `
      Actúas como un auditor de IA para una app de reciclaje y nutrición en Catalunya. 
      El usuario reporta en el bloque "${comida}" la categoría alimenticia "${categoria}".
      Nombre del plato: "${nombreItem}". Descripción del usuario: "${descripcion}".
      
      Analiza la fotografía adjunta. Determina si corresponde de forma legítima a comida o residuos que encajen en la categoría especificada.
      
      Responde ESTRICTAMENTE con este formato JSON:
      {
        "valido": true o false,
        "motivo": "Explicación corta en español de por qué se aprobó o rechazó"
      }
      Si la foto es borrosa, no contiene comida, es una pantalla en negro o es un intento de fraude, pon "valido": false.
    `;

    // 4. Ejecutar auditoría por IA
    const resultadoIA = await model.generateContent([promptDefinitivo, fotoParaIA]);
    const respuestaJSON = JSON.parse(resultadoIA.response.text());

    const aprobado = respuestaJSON.valido === true;
    const estadoValidacion = aprobado ? 'APROBADO' : 'RECHAZADO';
    const puntos = aprobado ? 1 : 0; // Cumple tu regla: 1 punto exacto por comida aprobada

    // 5. Persistencia directa en Atlas usando tu modelo exacto
    const nuevoAvance = await AvanceDiario.create({
      usuario,
      comida,
      categoria,
      nombreItem,
      descripcion,
      fechaString,
      fotoUrl: urlFotoCloudinary,
      puntosOtorgados: puntos,
      estado: estadoValidacion,
      motivoIA: respuestaJSON.motivo
    });

    // Nota: Si manejas un acumulado en la colección de usuarios, aquí puedes actualizarlo si (aprobado === true)

    res.status(201).json({
      ok: true,
      msg: aprobado ? '¡Avance diario validado por la IA con éxito! 🎉' : 'Entrada rechazada por la IA ⛔',
      data: nuevoAvance
    });

  } catch (error: any) {
    // Controlar el error del índice único compuesto por si intentan meter doble comida el mismo día
    if (error.code === 11000) {
      res.status(400).json({ ok: false, msg: 'Ya registraste este bloque de comida para el día de hoy.' });
      return;
    }
    console.error('❌ Error en auditoría por IA:', error);
    res.status(500).json({ ok: false, msg: 'Error interno del servidor al procesar el avance diario.' });
  }
};
