import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { dbConnection } from '../database/config';
import Usuario from '../models/usuario';
import Profile from '../models/profile';

// Cargar variables de entorno del archivo .env
dotenv.config();

// IDs fijos para mantener consistencia relacional en tus pruebas
const SUPERADMIN_ID = '6509d14bb94908df43a2b5ef';
const EDITOR_ID = '69eaab0919ab9e7948b4bcc1';
const USER_ID = '67069ab14c6e398ef9b4ccd2';

const usuariosData = [
    {
        _id: SUPERADMIN_ID,
        username: 'superadmin',
        email: 'superadmin@superadmin.com',
        role: 'SUPERADMIN',
        google: false,
        password: 'password', // Se hasheará en el ciclo de abajo
        createdAt: new Date('2024-01-01T08:00:00Z'),
        updatedAt: new Date('2024-01-01T08:00:00Z')
    },
    {
        _id: EDITOR_ID,
        username: 'editor_reciclaje',
        email: 'editor@reciclaje.com',
        role: 'EDITOR',
        google: false,
        password: 'password',
        createdAt: new Date('2024-01-01T08:00:00Z'),
        updatedAt: new Date('2024-01-01T08:00:00Z')
    },
    {
        _id: USER_ID,
        username: 'reciclador_pro',
        email: 'usuario@reciclaje.com',
        role: 'USER',
        google: false,
        password: 'password',
        createdAt: new Date('2024-01-01T08:00:00Z'),
        updatedAt: new Date('2024-01-01T08:00:00Z')
    }
];

const seedUsuarios = async (): Promise<void> => {
    try {
        // 1. Conectar a MongoDB Atlas de forma segura
        await dbConnection();
        console.log('🌱 Iniciando seeder de usuarios y perfiles para AppReciclaje...');

        // 2. Limpiar registros existentes para evitar duplicados de índice único
        await Promise.all([
            Usuario.deleteMany({}),
            Profile.deleteMany({})
        ]);
        console.log('🗑️  Usuarios y perfiles anteriores eliminados de Atlas');

        // 3. Procesar datos, hashear contraseñas y generar los perfiles relacionales
        const perfilesAInsertar: any[] = [];
        
        const usuariosConHash = await Promise.all(
            usuariosData.map(async (u) => {
                const salt = bcryptjs.genSaltSync();
                const passwordHasheado = bcryptjs.hashSync(u.password, salt);
                
                // Generamos una ID única para el perfil que enlazará a este usuario
                const perfilId = new mongoose.Types.ObjectId();

                // Estructuramos el perfil extendido en blanco del reciclador
                perfilesAInsertar.push({
                    _id: perfilId,
                    usuario: u._id,
                    first_name: u.username,
                    last_name: 'Demo',
                    puntos_totales: u.role === 'USER' ? 150 : 0, // Le regalamos 150 puntos de bienvenida al usuario normal
                    puntos_actuales: u.role === 'USER' ? 150 : 0,
                    pais: 'Venezuela'
                });

                // Retornamos el objeto usuario acoplado con la referencia física de su perfil
                return {
                    ...u,
                    password: passwordHasheado,
                    profile: perfilId
                };
            })
        );

        // 4. Inserción masiva y atómica de documentos en MongoDB Atlas
        await Promise.all([
            (Usuario as any).insertMany(usuariosConHash),
            (Profile as any).insertMany(perfilesAInsertar)
        ]);

        console.log(`\n✅ ${usuariosData.length} Usuarios y Perfiles insertados exitosamente:`);
        console.log('   - superadmin@superadmin.com (password) 👑 [SUPERADMIN]');
        console.log('   - editor@reciclaje.com      (password) 🛠️ [EDITOR]');
        console.log('   - usuario@reciclaje.com     (password) ♻️ [USER + 150 PTS]');

    } catch (error) {
        console.error('❌ Error crítico al ejecutar el seeder:', error);
        process.exit(1);
    } finally {
        // 5. Desconectar el cliente de la base de datos distribuida
        await mongoose.connection.close();
        console.log('\n🔌 Conexión a MongoDB Atlas cerrada de forma segura');
        process.exit(0);
    }
};

seedUsuarios();
