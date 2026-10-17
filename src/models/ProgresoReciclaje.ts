import { Schema, model, Document } from 'mongoose';

export interface IProgresoReciclaje extends Document {
  usuarioId: Schema.Types.ObjectId;
  categoria: 'Proteínas' | 'Carbohidratos' | 'Vegetales / Frutas';
  descripcion: string;
  fotoUrl: string;
  puntos: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivoIA: string;
  createdAt: Date;
}

const ProgresoReciclajeSchema = new Schema<IProgresoReciclaje>({
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  categoria: { type: String, required: true, enum: ['Proteínas', 'Carbohidratos', 'Vegetales / Frutas'] },
  descripcion: { type: String, required: true, trim: true },
  fotoUrl: { type: String, required: true },
  puntos: { type: Number, default: 0 },
  estado: { type: String, default: 'pendiente', enum: ['pendiente', 'aprobado', 'rechazado'] },
  motivoIA: { type: String, default: 'Pendiente de auditoría por IA' },
  createdAt: { type: Date, default: Date.now }
});

export const ProgresoReciclaje = model<IProgresoReciclaje>('ProgresoReciclaje', ProgresoReciclajeSchema);
