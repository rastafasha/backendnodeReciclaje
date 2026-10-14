import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {TipEcologico} from '../models/tipEcologico';

// Configura dotenv para poder leer el archivo .env de la raíz
dotenv.config();

// 🛒 Píldoras diarias de reciclaje adaptadas al mercado español, Mercadona y UCC
const tipsEcológicosSemilla = [
  {
    titulo: 'Reciclaje de Botellas PET Mercadona 🛒',
    descripcion: 'Deposita tus botellas vacías de agua o refresco Hacendado en los contenedores amarillos del campus. ¡Cada envase suma 15 puntos a tu racha verde!',
    activo: true
  },
  {
    titulo: 'El Truco del Vidrio en el Punto Verde 🍾',
    descripcion: '¿Sabías que el vidrio se recicla al 100% infinitas veces? Lleva los frascos de conservas al contenedor verde UCC y asegura 25 puntos extra esta semana.',
    activo: true
  },
  {
    titulo: '¡Cuidado con los Bricks de Leche! 🥛',
    descripcion: 'Los bricks no van al contenedor azul de papel. Aunque parezcan de cartón, contienen plástico y aluminio. Deposítalos siempre en el contenedor amarillo.',
    activo: true
  },
  {
    titulo: 'Puntos Limpios para Pilas y Baterías 🔋',
    descripcion: 'Una sola pila de botón puede contaminar miles de litros de agua. Tráelas a los contenedores especiales en la conserjería de la UCC y protege el campus.',
    activo: true
  },
  {
    titulo: 'Evita las Bolsas de un Solo Uso 🛍️',
    descripcion: 'Acostúmbrate a llevar tu bolsa de rafia reutilizable de Mercadona cuando hagas las compras de la semana. Menos plástico significa un planeta más limpio.',
    activo: true
  }
];

const ejecutarSeeder = async () => {
  const mongoUri = process.env.DB_MONGO;

  if (!mongoUri) {
    console.error('❌ Error: No se encontró la variable de entorno de conexión a MongoDB Atlas.');
    process.exit(1);
  }

  try {
    console.log('📡 Conectando a MongoDB Atlas para sembrar datos...');
    await mongoose.connect(mongoUri);

    console.log('🧹 Limpiando colección vieja de tips ecologicos...');
    await TipEcologico.deleteMany({});

    console.log('🌱 Inyectando píldoras ecológicas semilla...');
    await TipEcologico.insertMany(tipsEcológicosSemilla);

    console.log('✅ [SEEDER EXITOSO]: Datos de prueba sembrados correctamente en Atlas.');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error crítico ejecutando el seeder de consejos:', error);
    process.exit(1);
  }
};

// Arrancamos el script
ejecutarSeeder();