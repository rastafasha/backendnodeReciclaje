import { Schema, model, Document, Model } from 'mongoose';

// 1. Definimos el contrato estricto de TypeScript para la colección
export interface ITipEcologico extends Document {
  titulo: string;
  descripcion: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Diseñamos el esquema físico que se sembrará en MongoDB Atlas
const tipEcologicoSchema = new Schema<ITipEcologico>({
  titulo: { 
    type: String, 
    required: [true, 'El título del consejo es obligatorio.'],
    trim: true 
  },
  descripcion: { 
    type: String, 
    required: [true, 'La descripción o cuerpo del tip es obligatoria.'],
    trim: true 
  },
  activo: { 
    type: Boolean, 
    default: true // Por defecto se publica visible para los concursantes
  }
}, { 
  // 🧼 Mapea a una colección limpia y activa las fechas automáticas de Mongoose
  collection: 'app_tips_ecologicos', 
  timestamps: true 
});

// 3. Exportamos el modelo listo para ser inyectado en tus controladores
export const TipEcologico = model<ITipEcologico>('TipEcologico', tipEcologicoSchema) as unknown as Model<ITipEcologico>;

