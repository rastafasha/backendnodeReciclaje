import { Schema, model, Model } from 'mongoose';

// 1. Interfaz PURA de datos
export interface IProfile {
  usuario: Schema.Types.ObjectId;  // Relación inversa con el Usuario
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;            // Foto de perfil del reciclador
  puntos_totales: number;         // Histórico de puntos ganados
  puntos_actuales: number;        // Puntos disponibles para canjear
  pais?: string;
  ciudad?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Esquema físico de Mongoose (Definido de forma estándar)
const profileSchema = new Schema({
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El ID de usuario es obligatorio para enlazar el perfil'],
    unique: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar_url: {
    type: String,
    default: 'https://cloudinary.com'
  },
  puntos_totales: {
    type: Number,
    default: 0,
    min: 0
  },
  puntos_actuales: {
    type: Number,
    default: 0,
    min: 0
  },
  pais: {
    type: String,
    trim: true
  },
  ciudad: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { collection: 'perfiles' });

// Mutación JSON estándar para cambiar _id por id en las respuestas de la API
profileSchema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject() as any;
  object.id = _id;
  return object;
});

// 3. 🚀 LÍNEA CORREGIDA: Removemos el genérico de la función para engañar al compilador y romper el bucle recursivo
const Profile = model('Profile', profileSchema) as unknown as Model<IProfile>;

export default Profile;
