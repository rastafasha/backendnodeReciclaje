import { Schema, model, Model } from 'mongoose';

// 1. Interfaz limpia con tus campos reales de reciclaje y GAMIFICACIÓN
export interface IUsuario {
  username: string;
  email: string;
  identificacion: string;
  password?: string;
  role: string;
  terminos?: boolean;
  google: boolean;
  facebook: boolean;
  profile?: Schema.Types.ObjectId; 
  
  // 🔐 CAMPOS NUEVOS AGREGADOS A LA INTERFAZ
  token_recovery?: string; 
  token_expiry?: Date;

  // 🎮 CAMPOS NUEVOS DE GAMIFICACIÓN PARA EL PARTICIPANTE
  puntosGamificacion: number;
  habitosCompletados: number;

  createdAt: Date;
  updatedAt: Date;
}

// 2. Esquema físico de Mongoose
const usuarioSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  identificacion: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'USER' },
  terminos: { type: Boolean, required: false },
  google: { type: Boolean, default: false },
  facebook: { type: Boolean, default: false },
  profile: { type: Schema.Types.ObjectId, ref: 'Profile' }, 
  
  // 🔐 CAMPOS NUEVOS INYECTADOS EN EL ESQUEMA FÍSICO
  token_recovery: { type: String, required: false },
  token_expiry: { type: Date, required: false },

  // 🎮 CAMPOS NUEVOS DE GAMIFICACIÓN EN EL ESQUEMA FÍSICO
  puntosGamificacion: { type: Number, default: 0, required: true },
  habitosCompletados: { type: Number, default: 0, required: true },
  
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true }
}, { collection: 'usuarios' }); // 👈 Apunta correctamente a tu colección física

// 3. Mutación JSON (Esconde password y cambia _id a uid)
usuarioSchema.method('toJSON', function() {
  const { __v, _id, password, ...object } = this.toObject() as any;
  object.uid = _id;
  return object;
});

// 4. 🚀 LÍNEA CORREGIDA: Mantienes tu bypass de compilación intacto
const Usuario = model('Usuario', usuarioSchema) as unknown as Model<IUsuario>;

export default Usuario;
