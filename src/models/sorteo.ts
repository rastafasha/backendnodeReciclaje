import { Schema, model, Document, Model } from 'mongoose';

export interface ISorteo extends Document {
  totalElegibles: number;
  cantidadGanadores: number;
  ganadores: Schema.Types.ObjectId[]; // Referencias a los usuarios que ganaron
  creado_por: Schema.Types.ObjectId;  // ID del administrador emisor
  createdAt: Date;
}

const sorteoSchema = new Schema<ISorteo>({
  totalElegibles: { type: Number, required: true },
  cantidadGanadores: { type: Number, required: true },
  ganadores: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  }],
  creado_por: { 
    type: Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  }
}, { collection: 'sorteos_emitidos', timestamps: { createdAt: true, updatedAt: false } });

const Sorteo = model<ISorteo>('Sorteo', sorteoSchema) as unknown as Model<ISorteo>;
export default Sorteo;