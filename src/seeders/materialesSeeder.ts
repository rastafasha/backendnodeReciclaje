import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { dbConnection } from '../database/config';
import AvanceDiario from '../models/avanceDiario'; // Sincronizado con tu modelo actual de hábitos

// Cargar variables de entorno del archivo .env
dotenv.config();

// IDs fijos que usamos en el seeder de usuarios para mantener la integridad referencial
const USER_ID = '67069ab14c6e398ef9b4ccd2';       // Tu usuario 'reciclador_pro'
const EDITOR_ID = '69eaab0919ab9e7948b4bcc1';     // Tu usuario 'editor_reciclaje'

// Generamos una racha de hábitos simulada de días consecutivos
const avancesData = [
    // 🗓️ DÍA 1
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'DESAYUNO',
        categoria: 'CARBOHIDRATOS',
        nombreItem: 'Tostadas integrales con tomate',
        descripcion: 'Se reciclaron las cáscaras de tomate en el contenedor orgánico.',
        puntosOtorgados: 1,
        fechaString: '2026-10-01',
        createdAt: new Date('2026-10-01T08:30:00Z'),
        updatedAt: new Date('2026-10-01T08:30:00Z')
    },
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'ALMUERZO',
        categoria: 'PROTEINAS',
        nombreItem: 'Pechuga de pollo con arroz',
        descripcion: 'Aprovechamiento de residuos orgánicos vegetales del acompañamiento.',
        puntosOtorgados: 1,
        fechaString: '2026-10-01',
        createdAt: new Date('2026-10-01T13:15:00Z'),
        updatedAt: new Date('2026-10-01T13:15:00Z')
    },
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'CENA',
        categoria: 'VEGETALES_FRUTAS',
        nombreItem: 'Ensalada verde con manzana',
        descripcion: 'Cáscaras de manzana procesadas correctamente en la separación diaria.',
        puntosOtorgados: 1,
        fechaString: '2026-10-01',
        createdAt: new Date('2026-10-01T20:00:00Z'),
        updatedAt: new Date('2026-10-01T20:00:00Z')
    },

    // 🗓️ DÍA 2
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'DESAYUNO',
        categoria: 'VEGETALES_FRUTAS',
        nombreItem: 'Bowl de frutas de temporada',
        descripcion: 'Separación selectiva de restos orgánicos de frutas en la cocina.',
        puntosOtorgados: 1,
        fechaString: '2026-10-02',
        createdAt: new Date('2026-10-02T08:45:00Z'),
        updatedAt: new Date('2026-10-02T08:45:00Z')
    },
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'ALMUERZO',
        categoria: 'CARBOHIDRATOS',
        nombreItem: 'Pasta con salsa de verduras',
        descripcion: 'Concienciación de desecho correcto de residuos vegetales.',
        puntosOtorgados: 1,
        fechaString: '2026-10-02',
        createdAt: new Date('2026-10-02T13:40:00Z'),
        updatedAt: new Date('2026-10-02T13:40:00Z')
    },
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'CENA',
        categoria: 'PROTEINAS',
        nombreItem: 'Tortilla de espinacas',
        descripcion: 'Separación de cáscaras de huevo depositadas en orgánico.',
        puntosOtorgados: 1,
        fechaString: '2026-10-02',
        createdAt: new Date('2026-10-02T20:15:00Z'),
        updatedAt: new Date('2026-10-02T20:15:00Z')
    },

    // 🗓️ DÍA 3 (Simulamos que el usuario solo llenó Desayuno y Almuerzo)
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'DESAYUNO',
        categoria: 'CARBOHIDRATOS',
        nombreItem: 'Tortitas de avena y plátano',
        descripcion: 'Desecho de conchas de plátano gestionadas en bolsa compostable.',
        puntosOtorgados: 1,
        fechaString: '2026-10-03',
        createdAt: new Date('2026-10-03T09:00:00Z'),
        updatedAt: new Date('2026-10-03T09:00:00Z')
    },
    {
        usuario: new mongoose.Types.ObjectId(USER_ID),
        comida: 'ALMUERZO',
        categoria: 'PROTEINAS',
        nombreItem: 'Filete de merluza al horno',
        descripcion: 'Separación de residuos orgánicos del pescado de manera inmediata.',
        puntosOtorgados: 1,
        fechaString: '2026-10-03',
        createdAt: new Date('2026-10-03T14:10:00Z'),
        updatedAt: new Date('2026-10-03T14:10:00Z')
    },

    // 👤 REGISTRO DE SIMULACIÓN PARA OTRO USUARIO (Editor/Admin)
    {
        usuario: new mongoose.Types.ObjectId(EDITOR_ID),
        comida: 'ALMUERZO',
        categoria: 'VEGETALES_FRUTAS',
        nombreItem: 'Crema de calabaza',
        descripcion: 'Desecho selectivo de semillas y piel de calabaza en contenedor idóneo.',
        puntosOtorgados: 1,
        fechaString: '2026-10-03',
        createdAt: new Date('2026-10-03T13:30:00Z'),
        updatedAt: new Date('2026-10-03T13:30:00Z')
    }
];

const seedAvances = async (): Promise<void> => {
    try {
        // 1. Conectar a MongoDB Atlas de forma segura
        await dbConnection();
        console.log('🌱 Iniciando seeder de racha de hábitos diarios para Mercadona Premia...');

        // 2. Limpiar registros anteriores de la colección para arrancar en limpio
        await AvanceDiario.deleteMany({});
        console.log('🗑️  Colección de avances diarios vaciada de Atlas con éxito');

        // 3. Inserción masiva de la estructura de alimentación
        await (AvanceDiario as any).insertMany(avancesData);

        console.log(`\n✅ ${avancesData.length} Hábitos y comidas inyectados correctamente.`);
        console.log(`   - Historial de racha listo para simular: usuario@reciclaje.com`);

    } catch (error: any) {
        console.error('❌ Error crítico al ejecutar el seeder de avances:', error.message);
        process.exit(1);
    } finally {
        // 4. Cerrar el canal de comunicación limpiamente
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB Atlas cerrada de forma segura\n');
        process.exit(0);
    }
};

seedAvances();
