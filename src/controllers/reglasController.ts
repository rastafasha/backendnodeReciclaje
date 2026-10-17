import { Request, Response } from 'express';
import { ReglasConcurso } from '../models/reglas';

// GET: Obtener las reglas actuales (Público para la PWA)
export const getReglas = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Traemos todos los documentos de la base de datos de forma independiente
    const reglas = await ReglasConcurso.find();
    
    // Devolvemos el array puro para que tu servicio de Angular lo mapee sin problemas
    res.status(200).json(reglas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el listado de reglas', error });
  }
};

// PUT: Actualizar las reglas (Privado para el Admin CRM)
export const updateReglas = async (req: Request, res: Response): Promise<void> => {
  try {
    // 🎯 CAPTURA DEL ID: Ahora buscamos por el ID que viene en la ruta o en el cuerpo
    const { id, diasRequeridos, primerLugar, segundoLugar, tercerLugar } = req.body;

    if (!id) {
      res.status(400).json({ message: 'El ID de la regla es obligatorio para poder editarla.' });
      return;
    }

    const reglasActualizadas = await ReglasConcurso.findByIdAndUpdate(
      id, // 🔒 Filtramos estrictamente por el ID de ese registro específico
      { 
        diasRequeridos, 
        primerLugar, 
        segundoLugar, 
        tercerLugar,
        actualizadoEn: new Date() 
      },
      { new: true } // Devuelve el documento modificado
    );

    if (!reglasActualizadas) {
      res.status(404).json({ message: 'No se encontró ninguna regla con el ID proporcionado.' });
      return;
    }

    res.status(200).json({
      message: '¡Regla actualizada con éxito por su ID! 🚀',
      data: reglasActualizadas
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la regla desde el CRM', error });
  }
};

export const createReglas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { diasRequeridos, primerLugar, segundoLugar, tercerLugar } = req.body;

    const nuevaRegla = await ReglasConcurso.create({
      diasRequeridos,
      primerLugar,
      segundoLugar,
      tercerLugar,
      actualizadoEn: new Date()
    });

    res.status(201).json({
      message: 'Nueva regla de concurso creada con éxito 🎨',
      data: nuevaRegla
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la regla', error });
  }
};
