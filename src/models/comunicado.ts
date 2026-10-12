import { Schema, model, Document, Model } from 'mongoose';

export type TipoComunicado = 'EVENTO' | 'MANTENIMIENTO' | 'REUNION' | 'URGENTE' | 'CARTELERA';

export interface IComunicado extends Document {
  titulo: string;
  mensaje: string;
  tipo: TipoComunicado;
  alcance_residencia: string; // Se mantiene por estructura del front ('TODOS')
  alcance_torre: string;      // Se mantiene por estructura del front ('AMBAS')
  creado_por: Schema.Types.ObjectId;
  notificado_push: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const comunicadoSchema = new Schema<IComunicado>({
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  
  // Categoría del aviso adaptada a tus interfaces del front
  tipo: { 
    type: String, 
    enum: ['EVENTO', 'MANTENIMIENTO', 'REUNION', 'URGENTE', 'CARTELERA'], 
    default: 'CARTELERA' 
  },

  // Valores estructurales requeridos por el formulario de Angular
  alcance_residencia: { type: String, default: 'TODOS' },
  alcance_torre: { type: String, default: 'AMBAS' },

  // Trazabilidad del administrador emisor
  creado_por: { 
    type: Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },

  notificado_push: { type: Boolean, default: false }
}, { collection: 'comunicados', timestamps: true });

const Comunicado = model<IComunicado>('Comunicado', comunicadoSchema) as unknown as Model<IComunicado>;
export default Comunicado;