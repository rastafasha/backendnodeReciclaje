import { Schema, model, Document } from 'mongoose';

export interface ISeccionLegal {
  subtitulo: string;
  contenido: string;
}

export interface ITerminosCondiciones extends Document {
  tituloGlobal: string;
  introduccion: string;
  secciones: ISeccionLegal[];
  version: string;
  actualizadoEn: Date;
}

const TerminosSchema = new Schema<ITerminosCondiciones>({
  tituloGlobal: { type: String, required: true, default: 'Términos de Uso y Condiciones' },
  introduccion: { type: String, required: true },
  secciones: [{
    subtitulo: { type: String, required: true },
    contenido: { type: String, required: true }
  }],
  version: { type: String, required: true, default: 'v1.0.0' },
  actualizadoEn: { type: Date, default: Date.now }
});

export const TerminosCondiciones = model<ITerminosCondiciones>('TerminosCondiciones', TerminosSchema);
