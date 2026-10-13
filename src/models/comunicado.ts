// src/models/comunicado.ts
import { Schema, model, Document, Model } from 'mongoose';

// ♻️ Nuevos tipos de comunicados adaptados a la competencia y gamificación ambiental
export type TipoComunicado = 'SORTEO' | 'PREMIO_MERCADONA' | 'MANTENIMIENTO_PWA' | 'URGENTE' | 'AVISO_GENERAL';

export interface IComunicado extends Document {
  titulo: string;
  mensaje: string;
  tipo: TipoComunicado;
  creado_por: Schema.Types.ObjectId;
  notificado_push: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const comunicadoSchema = new Schema<IComunicado>({
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  
  tipo: { 
    type: String, 
    enum: ['SORTEO', 'PREMIO_MERCADONA', 'MANTENIMIENTO_PWA', 'URGENTE', 'AVISO_GENERAL'], 
    default: 'AVISO_GENERAL' 
  },

  // Trazabilidad limpia del administrador emisor
  creado_por: { 
    type: Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },

  notificado_push: { type: Boolean, default: false }
}, { collection: 'app_comunicados', timestamps: true }); // 🧼 Cambiamos a una colección unificada

const Comunicado = model<IComunicado>('Comunicado', comunicadoSchema) as unknown as Model<IComunicado>;
export default Comunicado;
