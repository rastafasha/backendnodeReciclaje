import mongoose from 'mongoose';

// Configuraciones globales de Mongoose
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', true);

export const dbConnection = async (): Promise<void> => {
    // Verificar si la variable de entorno está definida (Cambiamos DB_MONGO por DATABASE_URL si sigues el estándar anterior)
    const mongoUri = process.env.DB_MONGO || process.env.DATABASE_URL;

    if (!mongoUri) {
        console.warn('⚠️ ADVERTENCIA: No se ha definido la URI de MongoDB en las variables de entorno');
        return;
    }

    // Check if already connected (1 = connected)
    if (mongoose.connection.readyState === 1) {
        console.log('🍃 DB ya conectada (cacheada)');
        return;
    }

    // Check if connecting (2 = connecting)
    if (mongoose.connection.readyState === 2) {
        console.log('⏳ DB ya en proceso de conexión, esperando...');
        await new Promise<void>((resolve, reject) => {
            mongoose.connection.once('open', () => resolve());
            mongoose.connection.once('error', (err) => reject(err));
        });
        return;
    }

    try {
        console.log('🔌 Conectando a MongoDB Atlas...');
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, 
            socketTimeoutMS: 45000, 
            maxPoolSize: 10, 
            minPoolSize: 1,
        });
        
        console.log('✅ DB MongoDB Online');
        
        // Manejadores de eventos de conexión en tiempo de ejecución
        mongoose.connection.on('error', (err) => {
            console.error('💥 Error de conexión MongoDB:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('🔌 MongoDB desconectado');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('♻️ MongoDB reconectado');
        });
        
    } catch (error: any) {
        console.error('❌ Error al conectar con MongoDB:', error.message);
        throw error; 
    }
};
