import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ReglasConcurso } from '../models/reglas';

// Cargar variables de entorno (.env)
dotenv.config();

const ejecutarSeeder = async () => {
  try {
    // 1. Validar que la URI de MongoDB exista
    const mongoUri = process.env.DB_MONGO;
    if (!mongoUri) {
      throw new Error('❌ No se encontró la cadena de conexión a MongoDB en las variables de entorno.');
    }

    console.log('⏳ Conectando a MongoDB Atlas para inyectar seeders...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conexión establecida.');

    // 2. Limpiar datos previos de la colección para asegurar un único documento global
    console.log('🧹 Limpiando colección de reglas del concurso...');
    await ReglasConcurso.deleteMany({});

    // 3. Crear el registro base real adaptado a UCC Catalunya
    const reglasIniciales = new ReglasConcurso({
      diasRequeridos: 21,
      primerLugar: '¡Un patinete eléctrico Eco-Tech de última generación! Ideal para moverte de forma sostenible por la ciudad sin contaminar el aire.',
      segundoLugar: 'Un set premium de reciclaje inteligente para el hogar, que incluye contenedores automatizados con sensores de peso y bolsas compostables para un año.',
      tercerLugar: 'Una tarjeta de regalo de 50€ para canjear en comercios locales y cooperativas ecológicas asociadas a UCC Catalunya.'
    });

    await reglasIniciales.save();
    console.log('🚀 ¡Seeder ejecutado con éxito! Reglas iniciales cargadas en caliente.');

  } catch (error) {
    console.error('🚨 Error fatal durante la ejecución del seeder:', error);
  } finally {
    // 4. Desconectar de forma limpia para que el proceso de Node finalice
    console.log('🔌 Desconectando de MongoDB...');
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Disparar la ejecución
ejecutarSeeder();
