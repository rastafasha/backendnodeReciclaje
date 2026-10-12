import { Request, Response } from 'express';
import Usuario from '../models/usuario'; // Tu modelo importado
import Profile from '../models/profile';
import Sorteo from '../models/sorteo';
import Notificacion from '../models/notificacion';
import { enviarNotificacionPushGlobal } from './pushController'; // Tu motor enviador real

export const obtenerTablaLiderazgo = async (req: Request, res: Response): Promise<Response> => {
  try {
    const participantes = await Usuario.aggregate([
      // 1. 🎯 Filtrar únicamente a los usuarios con rol 'USER'
      {
        $match: {
          role: 'USER'
        }
      },

      // 2. 🔗 Relación con la colección 'perfiles' para traer puntos y avatares
      {
        $lookup: {
          from: 'perfiles', // Nombre físico de tu colección en MongoDB Atlas
          localField: 'profile',
          foreignField: '_id',
          as: 'perfil_embebido'
        }
      },
      {
        $unwind: {
          path: '$perfil_embebido',
          preserveNullAndEmptyArrays: true
        }
      },

      // 3. 🎮 CORRECCIÓN CRÍTICA: Buscar y contar dinámicamente sus hábitos completados reales
      {
        $lookup: {
          from: 'avances_diarios', // Colección física donde el seeder metió los hábitos
          localField: '_id',       // El ID del usuario en la colección 'usuarios'
          foreignField: 'usuario', // El campo de relación en 'avances_diarios'
          as: 'habitos_registrados'
        }
      },

      // 4. 🗂️ Proyección estructurada idéntica a tus interfaces de Angular
      {
        $project: {
          _id: 1,
          uid: '$_id',
          username: 1,
          email: 1,
          identificacion: 1,
          role: 1,
          google: 1,
          facebook: 1,
          createdAt: 1,
          profile: {
            id: '$perfil_embebido._id',
            usuario: '$perfil_embebido.usuario',
            first_name: '$perfil_embebido.first_name',
            last_name: '$perfil_embebido.last_name',
            phone_mobile: '$perfil_embebido.phone_mobile',
            pais: '$perfil_embebido.pais',
            ciudad: '$perfil_embebido.ciudad',
            avatar_url: '$perfil_embebido.avatar_url',
            puntos_totales: { $ifNull: ['$perfil_embebido.puntos_totales', 0] },
            puntos_actuales: { $ifNull: ['$perfil_embebido.puntos_actuales', 0] },
            // 🔥 AQUÍ ESTÁ LA MAGIA: Contamos el tamaño del array de hábitos que tiene en Atlas
            habitosCompletados: { $size: { $ifNull: ['$habitos_registrados', []] } }
          },
          // Evaluamos la clasificación basada en tus puntos reales de perfil
          clasificadoSorteo: {
            $cond: { if: { $gte: [{ $ifNull: ["$perfil_embebido.puntos_actuales", 0] }, 55] }, then: true, else: false }
          }
        }
      },

      // 5. 📊 Ordenar el ranking por puntos actuales descendentes
      { $sort: { 'profile.puntos_actuales': -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: participantes
    });

  } catch (error: any) {
    console.error("Error en obtenerTablaLiderazgo con agregación de hábitos:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al calcular los hábitos y puntos del liderazgo",
      error: error.message
    });
  }
};

/**
 * 📊 OBTENER MÉTRICAS GLOBALES TOTALIZADAS PARA EL DASHBOARD ECOLÓGICO PRINCIPAL
 */
export const obtenerMetricasDashboard = async (req: Request, res: Response): Promise<Response> => {
  try {

    const anioActual = new Date().getFullYear();
    // Ejecutamos los conteos y sumas en paralelo para optimizar el rendimiento en Atlas
    const [totalParticipantes, totalHabitosCompletados, estadisticasPuntos, historialMensual] = await Promise.all([
      // A. Universo de usuarios que compiten
      Usuario.countDocuments({ role: 'USER' }),

      // B. Universo de hábitos acumulados en el sistema (Colección avances_diarios)
      Usuario.db.collection('avances_diarios').countDocuments(),

      // C. Agregación sobre perfiles para extraer sumatorias globales y clasificados
      Usuario.db.collection('perfiles').aggregate([
        {
          $group: {
            _id: null,
            puntosTotalesGlobales: { $sum: '$puntos_totales' },
            puntosActualesGlobales: { $sum: '$puntos_actuales' },
            // Sumamos 1 por cada perfil que cumpla la meta de >= 55 puntos
            clasificadosSorteo: {
              $sum: { $cond: [{ $gte: ['$puntos_actuales', 55] }, 1, 0] }
            }
          }
        }
      ]).toArray(),

      // D. 📈 AGREGACIÓN REAL PARA EL LINE CHART: Agrupar hábitos por mes del año actual
      Usuario.db.collection('avances_diarios').aggregate([
       {
          $project: {
            // \$toDate convierte Strings a Date, y si ya es Date lo ignora de forma segura
            fechaObjeto: { toDate: "createdAt" }
          }
        },
        {
          $match: {
            // Ahora sí comparamos objetos Date reales de forma segura
            fechaObjeto: {
              $gte: new Date(`${anioActual}-01-01T00:00:00.000Z`),
              $lte: new Date(`${anioActual}-12-31T23:59:59.999Z`)
            }
          }
        },
        {
          $group: {
            _id: { month: "fechaObjeto" }, // 🟢 Extrae el número del mes (1 al 12)
            total: { $sum: 1 } } }, {$sort: { '_id': 1 } } // Ordenar de Enero a Diciembre
      ]).toArray()

      
    ]);

    // Procesamos el array de MongoDB garantizando las 12 posiciones fijas para Chart.js
    const datosLineChart = new Array(12).fill(0);
    if (historialMensual && Array.isArray(historialMensual)) {
      historialMensual.forEach((item: any) => {
        if (item._id && item._id >= 1 && item._id <= 12) {
          const mesIndex = item._id - 1; 
          datosLineChart[mesIndex] = item.total;
        }
      });
    }

    // Extraemos la información calculada del array resultante o asignamos valores por defecto
    const datosPuntos = estadisticasPuntos[0] || {
      puntosTotalesGlobales: 0,
      puntosActualesGlobales: 0,
      clasificadosSorteo: 0
    };
    // Calculamos los pendientes en caliente
    const clasificados = datosPuntos.clasificadosSorteo;
    const pendientes = Math.max(0, totalParticipantes - clasificados);


    return res.status(200).json({
      success: true,
       data: {
        totalParticipantes,
        totalHabitosCompletados,
        puntosTotalesGlobales: datosPuntos.puntosTotalesGlobales,
        puntosActualesGlobales: datosPuntos.puntosActualesGlobales,
        clasificadosSorteo: clasificados,
        distribucionSorteo: {
          clasificados,
          pendientes
        },
        evolucionMensualHabitos: datosLineChart
      }
    });

  } catch (error: any) {
    console.error("Error en obtenerMetricasDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al compilar estadísticas globales del dashboard",
      error: error.message
    });
  }
};


/**
 * 🎲 GATILLO DEL SORTEO PROPORCIONAL AUTOMÁTICO (Solo Admin)
 * POST /api/gamificacion/ejecutar-sorteo
 */
export const ejecutarSorteoProporcional = async (req: Request, res: Response): Promise<Response> => {
  const adminId = req.uid;

  try {
    // 1. Extraer perfiles que alcanzaron el umbral estricto de Coggle (puntos_actuales >= 55)
    const perfilesClasificados = await Profile.find({ puntos_actuales: { $gte: 55 } }).select('usuario');
    const totalElegibles = perfilesClasificados.length;

    if (totalElegibles === 0) {
      return res.status(404).json({
        ok: false,
        msg: 'No hay participantes clasificados que alcancen la meta mínima de 55 puntos.'
      });
    }

    // 2. Lógica matemática de Coggle: 1 ganador por cada 5 clasificados (mínimo 1)
    const cantidadGanadores = Math.max(1, Math.floor(totalElegibles / 5));

    // 3. Obtener el arreglo plano de IDs de usuarios
    let poolUsuarios = perfilesClasificados.map(p => p.usuario.toString());

    // 4. Algoritmo puro de barajado aleatorio (Fisher-Yates Shuffle)
    for (let i = poolUsuarios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolUsuarios[i], poolUsuarios[j]] = [poolUsuarios[j], poolUsuarios[i]];
    }

    // 5. Extraer la porción proporcional de ganadores
    const idsGanadoresStrings = poolUsuarios.slice(0, cantidadGanadores);

    // 6. Buscar los datos completos de identidad de los ganadores seleccionados
    const usuariosGanadores = await Usuario.find({ _id: { $in: idsGanadoresStrings } })
      .select('username email identificacion profile');

    // 7. Persistir la auditoría de la rifa en Atlas
    const nuevoSorteo = new Sorteo({
      totalElegibles,
      cantidadGanadores,
      ganadores: idsGanadoresStrings,
      creado_por: adminId
    });
    await nuevoSorteo.save();

    // 8. Inyectar automáticamente la alerta en la campana de notificaciones del ganador (Historial/Polling)
    const alertasGanadores = idsGanadoresStrings.map(uid => ({
      usuario: uid,
      titulo: '🎉 ¡Felicidades! Has ganado el Sorteo Mercadona',
      mensaje: 'Tu constancia en las 3 comidas ecológicas dio frutos. Has sido seleccionado en el sorteo.',
      tipo: 'RECOMPENSA_CANJEADA',
      leido: false
    }));
    await Notificacion.insertMany(alertasGanadores);

    return res.status(200).json({
      ok: true,
      msg: `Sorteo ejecutado. Se seleccionaron ${cantidadGanadores} ganadores de ${totalElegibles} elegibles.`,
      data: {
        sorteoId: nuevoSorteo._id,
        totalElegibles,
        cantidadGanadores,
        ganadores: usuariosGanadores
      }
    });

  } catch (error: any) {
    console.error('❌ [ERROR EN ALGORITMO SORTEO]:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error interno al procesar el algoritmo del sorteo',
      error: error.message
    });
  }
};

/**
 * 🎁 9. BOTÓN CTA DEL ADMIN: DISPARAR NOTIFICACIÓN PUSH EXCLUSIVA A LOS GANADORES
 * POST /api/gamificacion/notificar-ganadores
 */
export const notificarGanadoresPush = async (req: Request, res: Response): Promise<Response> => {
  const { sorteoId } = req.body;

  try {
    const sorteoInfo = await Sorteo.findById(sorteoId);
    if (!sorteoInfo) {
      return res.status(404).json({ ok: false, msg: 'Registro físico del sorteo no encontrado.' });
    }

    const tituloPush = '🎁 ¡Ganaste el premio de Mercadona! ♻️';
    const mensajePush = '¡Felicidades! Fuiste seleccionado en la ruleta de reciclaje. Revisa tu bandeja de entrada.';

    // Despachamos las alertas flotantes usando el motor asíncrono segmentado por uid
    const promesasPush = sorteoInfo.ganadores.map(uid => 
      enviarNotificacionPushGlobal(tituloPush, mensajePush, '/tabs/historial', uid.toString())
    );
    await Promise.all(promesasPush);

    return res.json({
      ok: true,
      msg: `Banners push flotantes despachados con éxito a los ${sorteoInfo.ganadores.length} ganadores.`
    });

  } catch (error: any) {
    return res.status(500).json({ ok: false, msg: 'Error al lanzar notificaciones push segmentadas', error: error.message });
  }
};