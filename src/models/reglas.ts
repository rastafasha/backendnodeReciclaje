import { Schema, model, Document } from 'mongoose';

// Interfaz para TypeScript
export interface IReglasConcurso extends Document {
  diasRequeridos: number;
  primerLugar: string;
  segundoLugar: string;
  tercerLugar: string;
  actualizadoEn: Date;
}

// Esquema de Mongoose
const ReglasConcursoSchema = new Schema<IReglasConcurso>({
  diasRequeridos: { type: Number, default: 21 },
  primerLugar: { type: String, required: true, default: 'Premio sorpresa para el primer lugar.' },
  segundoLugar: { type: String, required: true, default: 'Premio sorpresa para el segundo lugar.' },
  tercerLugar: { type: String, required: true, default: 'Premio sorpresa para el tercer lugar.' },
  actualizadoEn: { type: Date, default: Date.now }
});

export const ReglasConcurso = model<IReglasConcurso>('ReglasConcurso', ReglasConcursoSchema);
