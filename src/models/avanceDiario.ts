import { Schema, model, Model } from 'mongoose';

// 1. Tipos estrictos para las 3 comidas del Figma y Coggle
export type TipoComida = 'DESAYUNO' | 'ALMUERZO' | 'CENA';
export type CategoriaAlimento = 'PROTEINAS' | 'CARBOHIDRATOS' | 'VEGETALES_FRUTAS';

export interface IAvanceDiario {
  usuario: Schema.Types.ObjectId;  
  comida: TipoComida;            // Desayuno, Almuerzo o Cena
  categoria: CategoriaAlimento;  // Proteínas, Carbohidratos, Vegetales
  nombreItem: string;            // Nombre del plato/residuo
  descripcion: string;           // Descripción corta (máx caracteres)
  puntosOtorgados: number;       // Siempre sumará 1 punto por comida
  fechaString: string;           // Formato 'YYYY-MM-DD' para bloquear duplicados en el mismo día
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
    maxlength: [250, 'La descripción no puede superar los 250 caracteres'] // Restricción del Coggle
  },
  puntosOtorgados: {
    type: Number,
    default: 1 // Cada comida aprobada suma exactamente 1 punto
  },
  fechaString: {
    type: String, // Almacena '2026-10-09' para hacer validaciones de racha
    required: true
  }
}, { timestamps: true, collection: 'avances_diarios' });

// 🚀 ÍNDICE COMPUESTO ÚNICO: Evita físicamente que un usuario registre dos desayunos el mismo día
avanceDiarioSchema.index({ usuario: 1, comida: 1, fechaString: 1 }, { unique: true });

avanceDiarioSchema.method('toJSON', function() {
  const { __v, _id, ...object } = this.toObject() as any;
  object.id = _id;
  return object;
});

const AvanceDiario = model('AvanceDiario', avanceDiarioSchema) as unknown as Model<IAvanceDiario>;
export default AvanceDiario;
