import { Request, Response } from 'express';
import { ReglasConcurso } from '../models/reglas';

// GET: Obtener las reglas actuales (Público para la PWA)
export const getReglas = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Buscamos el único registro de configuración global
    let reglas = await ReglasConcurso.findOne();
    
    if (!reglas) {
      // Si no existe, creamos uno por defecto para no romper el frontend
      reglas = await ReglasConcurso.create({});
    }

    res.status(200).json(reglas);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las reglas del concurso', error });
  }
};

// PUT: Actualizar las reglas (Privado para el Admin CRM)
export const updateReglas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { diasRequeridos, primerLugar, segundoLugar, tercerLugar } = req.body;

    const reglasActualizadas = await ReglasConcurso.findOneAndUpdate(
      {}, // Filtro vacío para afectar al único documento global
      { 
        diasRequeridos, 
        primerLugar, 
        segundoLugar, 
        tercerLugar,
        actualizadoEn: new Date() 
      },
      { new: true, upsert: true } // Crea el documento si no existe y devuelve el nuevo
    );

    res.status(200).json({
      message: '¡Reglas actualizadas en caliente con éxito! 🚀',
      data: reglasActualizadas
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar las reglas desde el CRM', error });
  }
};
