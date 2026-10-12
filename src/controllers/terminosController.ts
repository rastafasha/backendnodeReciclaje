import { Request, Response } from 'express';
import { TerminosCondiciones } from '../models/TerminosCondiciones';

// GET: Consumido de forma abierta por los celulares
export const getTerminos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const terminos = await TerminosCondiciones.findOne();
    if (!terminos) {
      res.status(404).json({ ok: false, msg: 'No se encontraron folios legales configurados.' });
    }
    res.status(200).json(terminos);
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Error al obtener acuerdos legales', error });
  }
};

// PUT: Disparado exclusivamente desde el Admin CRM
export const updateTerminos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tituloGlobal, introduccion, secciones, version } = req.body;

    const terminosActualizados = await TerminosCondiciones.findOneAndUpdate(
      {}, // Filtro vacío para afectar al documento único global
      { tituloGlobal, introduccion, secciones, version, actualizadoEn: new Date() },
      { new: true, upsert: true } // Lo crea si es la primera vez que se corre
    );

    res.status(200).json({
      ok: true,
      msg: '¡Estatutos legales actualizados con éxito en Atlas! ⚖️',
      data: terminosActualizados
    });
  } catch (error) {
    res.status(500).json({ ok: false, msg: 'Error al inyectar cambios desde el CRM', error });
  }
};
