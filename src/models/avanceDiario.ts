import { Schema, model, Model } from 'mongoose';

export type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'CENA';
export type CategoriaAlimento = 'PROTEINAS' | 'CARBOHIDRATOS' | 'VEGETALES_FRUTAS';

export interface IAvanceDiario {
  usuario: Schema.Types.ObjectId;  
  comida: TipoComida;            
  categoria: CategoriaAlimento;  
  nombreItem: string;            
  descripcion: string;           
  puntosOtorgados: number;       
  fechaString: string;           
  fotoUrl: string;               // 📸 URL de la foto comprimida en Cloudinary
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'; // ⚖️ El veredicto de la IA
  motivoIA: string;             // 🧠 Explicación de Gemini
  createdAt: Date;
  updatedAt: Date;
}

const avanceDiarioSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',                
    required: [true, 'El usuario es obligatorio']
  },
  comida: {
    type: String,
    enum: ['DESAYUNO', 'ALMUERZO', 'CENA'],
    required: [true, 'El bloque de comida es obligatorio']
  },
  categoria: {
    type: String,
    enum: ['PROTEINAS', 'CARBOHIDRATOS', 'VEGETALES_FRUTAS'],
    required: [true, 'La categoría de alimento es obligatoria']
  },
  nombreItem: {
    type: String,
    required: [true, 'El nombre del ítem es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [250, 'La descripción no puede superar los 250 caracteres']
  },
  puntosOtorgados: {
    type: Number,
    default: 0 // Inicia en 0 hasta que la IA determine si es válido
  },
  fechaString: {
    type: String, 
    required: true
  },
  // 🆕 Nuevos campos integrados para la IA anti-fraude
  fotoUrl: {
    type: String,
    required: [true, 'La evidencia fotográfica de Cloudinary es obligatoria']
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'APROBADO', 'RECHAZADO'],
    default: 'PENDIENTE'
  },
  motivoIA: {
    type: String,
    default: 'Pendiente de auditoría por IA'
  }
}, { timestamps: true, collection: 'avances_diarios' });

avanceDiarioSchema.index({ usuario: 1, comida: 1, fechaString: 1 }, { unique: true });

avanceDiarioSchema.method('toJSON', function() {
  const { __v, _id, ...object } = this.toObject() as any;
  object.id = _id;
  return object;
});

const AvanceDiario = model('AvanceDiario', avanceDiarioSchema) as unknown as Model<IAvanceDiario>;
export default AvanceDiario;
