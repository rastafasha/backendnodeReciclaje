import { Request, Response } from 'express';
import { ProgresoReciclaje } from '../models/ProgresoReciclaje';

export const ejecutarTombolaAutomatizada = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 🎛️ PIPELINE DE AGREGACIÓN EN ATLAS: Filtra, agrupa, evalúa el umbral y elige al ganador
    const resultadoSorteo = await ProgresoReciclaje.aggregate([
      // Paso 1: Filtrar solo los aportes legítimos que fueron aprobados por la IA
      { 
        $match: { estado: 'aprobado' } 
      },
      
      // Paso 2: Agrupar por usuario y acumular sus puntos validados
      { 
        $group: { 
          _id: '$usuarioId', 
          puntosTotales: { $sum: '$puntos' } 
        } 
      },
      
      // Paso 3: Filtrar solo a los retadores que alcanzaron o superaron el umbral de 55 puntos
      { 
        $match: { puntosTotales: { $gte: 55 } } 
      },
      
      // Paso 4: Traer la información del usuario desde la colección 'usuarios' (Populate en agregaciones)
      {
        $lookup: {
          from: 'usuarios', // Asegúrate de que coincida con el nombre exacto de tu colección en Atlas
          localField: '_id',
          foreignField: '_id',
          as: 'datosUsuario'
        }
      },
      
      // Desenrollar el array del lookup para tener un objeto directo
      { $unwind: '$datosUsuario' },
      
      // Paso 5: ¡LA TÓMBOLA! Elige un documento al azar entre todos los clasificados
      { 
        $sample: { size: 1 } 
      }
    ]);

    // Si la tómbola no devolvió ningún documento es porque nadie ha alcanzado los 55 puntos
    if (resultadoSorteo.length === 0) {
      res.status(200).json({
        ok: true,
        msg: 'La tómbola se ejecutó correctamente, pero actualmente ningún participante ha alcanzado el umbral de 55 puntos aprobados.',
        ganador: null
      });
      return;
    }

    // Extraemos el único ganador seleccionado por el operador $sample
    const ganadorFinal = resultadoSorteo[0];

    // Opcional: Aquí podrías disparar un registro histórico en otra colección llamada 'Premios' 
    // o enviar un correo electrónico automático notificando el premio.

    res.status(200).json({
      ok: true,
      msg: '¡Tómbola finalizada con éxito! La Inteligencia Artificial y Atlas han elegido un ganador legítimo. 🏆',
      ganador: {
        usuarioId: ganadorFinal._id,
        nombre: ganadorFinal.datosUsuario.nombre, // Ajusta según las propiedades de tu modelo Usuario
        email: ganadorFinal.datosUsuario.email,
        puntosValidados: ganadorFinal.puntosTotales
      }
    });

  } catch (error) {
    console.error('❌ Error crítico al ejecutar la tómbola:', error);
    res.status(500).json({ 
      ok: false, 
      msg: 'Error interno en el servidor al procesar el sorteo aleatorio.' 
    });
  }
};
