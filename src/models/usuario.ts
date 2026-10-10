import { Schema, model, Model } from 'mongoose';

// 1. Interfaz limpia con tus campos reales de reciclaje
export interface IUsuario {
  username: string;
  email: string;
  password?: string;
  role: string;
  terminos?: boolean;
  google: boolean;
  facebook: boolean;
  profile?: Schema.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

// 2. Esquema físico de Mongoose (Se define de forma estándar)
const usuarioSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'USER' },
  terminos: { type: Boolean, required: false },
  google: { type: Boolean, default: false },
  facebook: { type: Boolean, default: false },
  profile: { type: Schema.Types.ObjectId, ref: 'Profile' }, 
  createdAt: { type: Date, default: Date.now, required: true },
  updatedAt: { type: Date, default: Date.now, required: true }
}, { collection: 'usuarios' });

// 3. Mutación JSON (Esconde password y cambia _id a uid)
usuarioSchema.method('toJSON', function() {
  const { __v, _id, password, ...object } = this.toObject() as any;
  object.uid = _id;
  return object;
});

// 4. 🚀 LÍNEA CORREGIDA: Removemos el genérico de la función para engañar al compilador y romper el bucle recursivo
const Usuario = model('Usuario', usuarioSchema) as unknown as Model<IUsuario>;

export default Usuario;
