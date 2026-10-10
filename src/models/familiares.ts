// src/models/familiar.ts
import { Schema, model, Document } from 'mongoose';

export interface IFamiliar extends Document {
  usuario: Schema.Types.ObjectId; // Quién lo registró
  nombre: string;
  apellido: string;
  parentesco: string;
  createdAt: Date;
}

const familiarSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID de usuario es obligatorio']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  apellido: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  parentesco: {
    type: String,
    required: [true, 'El parentesco es obligatorio'],
    enum: ['Esposa / Esposo', 'Hijo / Hija', 'Padre / Madre', 'Hermano / Hermana'] // Validado contra tus globos
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'familiares' });

// Mutación JSON estándar para cambiar _id por id en el frontend
familiarSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject() as any;
  object.id = _id;
  return object;
});

export default model<IFamiliar>('Familiar', familiarSchema);
