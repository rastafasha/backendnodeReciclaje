import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TerminosCondiciones } from '../models/TerminosCondiciones'; // Recuerda el .ts para entornos ESM nativos

// Cargar variables de entorno (.env)
dotenv.config();

const ejecutarSeederTerminos = async () => {
  try {
    // 1. Validar URI de MongoDB Atlas
    const mongoUri = process.env.DB_MONGO;
    if (!mongoUri) {
      throw new Error('❌ No se encontró la cadena de conexión a MongoDB en las variables de entorno.');
    }

    console.log('⏳ Conectando a MongoDB Atlas para inyectar bases legales...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conexión establecida.');

    // 2. Limpiar registros anteriores para evitar duplicaciones globales
    console.log('🧹 Limpiando colección de términos y condiciones...');
    await TerminosCondiciones.deleteMany({});

    // 3. Crear el documento base real adaptado a las regulaciones de la UCC
    const terminosIniciales = new TerminosCondiciones({
      tituloGlobal: 'Términos de Uso y Políticas de Participación',
      introduccion: 'Al utilizar la plataforma oficial de UCC Premia tu Reciclaje, aceptas cumplir con los lineamientos de transparencia ecológica, compromiso ciudadano y las normativas de sostenibilidad de Catalunya.',
      secciones: [
        {
          subtitulo: '1. Registro Seguro y Puntos',
          contenido: 'Cada retador acumulará puntos basados estrictamente en el peso y categoría de sus materiales reciclados válidos (Proteínas, Carbohidratos, Vegetales / Frutas). El fraude o alteración de datos anulará el progreso a cero.'
        },
        {
          subtitulo: '2. Mecánica del Sorteo',
          contenido: 'Únicamente los usuarios que alcancen o superen los 55 puntos acumulados al cierre del ciclo clasificarán a la tómbola automatizada de MongoDB Atlas.'
        },
        {
          subtitulo: '3. Protección de Datos',
          contenido: 'Tus credenciales de acceso (incluyendo OAuth Social de Google/Facebook) y tokens de sesión locales están encriptados y regulados bajo las normativas vigentes de privacidad europea y local.'
        }
      ],
      version: 'v2.4.0'
    });

    await terminosIniciales.save();
    console.log('🚀 ¡Seeder de Términos ejecutado con éxito! Estatutos legales cargados en caliente.');

  } catch (error) {
    console.error('🚨 Error fatal durante la ejecución del seeder de términos:', error);
  } finally {
    // 4. Desconexión limpia del proceso Node
    console.log('🔌 Desconectando de MongoDB...');
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Disparar la ejecución del script
ejecutarSeederTerminos();
