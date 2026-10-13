import { Socket, Server } from 'socket.io';
// 🚀 CORREGIDO: Importamos tus tipos reales del modelo de Avances Diarios
import AvanceDiario, { TipoComida } from '../models/avanceDiario'; 
import { enviarNotificacionPushGlobal } from '../controllers/pushController';
import jwt from 'jsonwebtoken';

export const socketController = (socket: Socket, io: Server) => {

     // 🔐 Capturamos el token enviado de forma segura desde el cliente de Angular/Ionic
    const token = socket.handshake.auth['x-token'] || socket.handshake.headers['x-token'];

    if (!token) {
        console.log('❌ [SOCKET RECHAZADO]: Conexión sin credenciales de token.');
        return socket.disconnect();
    }

     try {
        // Validamos el JWT con tu llave secreta del .env
        const payload: any = jwt.verify(token, process.env.JWT_SECRET || 'tu-llave-secreta');
        console.log(`🔌 [SOCKET CONECTADO]: Retador unificado con UID: ${payload.uid}`);
        
        // Unimos al usuario a una sala privada con su ID para enviarle alertas directas si es necesario
        socket.join(payload.uid);

    } catch (error) {
        console.log('❌ [SOCKET ERROR]: Token inválido o expirado.');
        return socket.disconnect();
    }

    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('join-room', (uid: string) => {
        socket.join(uid);
        console.log(`🏠 Usuario [${uid}] se unió a su sala privada`);
    });

    // ⚡ EVENTO SCONECTADO Y TIPADO AL 100%
    socket.on('nuevo-reciclaje', async (data: {
        usuarioId: string;
        material: TipoComida; // 🚀 CORREGIDO: Cambiado TipoMaterial por TipoComida (Línea 16)
        peso: number;
        puntos: number;
        detalle?: string;
    }) => {
        try {
            console.log(`♻️ Guardando registro de comida ${data.material} para el usuario ${data.usuarioId}`);

            // Formateamos la fecha de hoy para cumplir con tu índice compuesto único de Mongoose
            const hoyStr = new Date().toISOString().split('T')[0];

            // 1. Crear e insertar el registro en tu colección 'avances_diarios' usando el Modelo TS
            const nuevoRegistro = new AvanceDiario({
                usuario: data.usuarioId,
                comida: data.material, // Mapea a 'DESAYUNO', 'ALMUERZO' o 'CENA'
                categoria: 'VEGETALES_FRUTAS', // Valor por defecto o el que capture tu pasarela
                nombreItem: `Registro WebPush: ${data.material.toLowerCase()}`,
                descripcion: data.detalle || 'Hábito diario registrado correctamente.',
                puntosOtorgados: data.puntos,
                fechaString: hoyStr
            });

            await nuevoRegistro.save();
            
            await enviarNotificacionPushGlobal(
                '¡Puntos Sumados! 🎉',
                `Has ganado ${data.puntos} puntos por tu registro de ${data.material.toLowerCase()}.`,
                '/tabs/perfil', // Ruta de destino en Ionic
                data.usuarioId  // ID del reciclador para que solo le llegue a él
            );

            // 2. Emitir notificación en tiempo real a todo el sistema (Feed global)
            io.emit('feed-reciclaje', {
                mensaje: `¡Alguien acaba de registrar su ${data.material.toLowerCase()}! 🌎`,
                fecha: nuevoRegistro.createdAt
            });

            // 3. Enviar confirmación privada al usuario específico con los datos guardados
            io.to(data.usuarioId).emit('notificacion-privada', {
                titulo: '¡Registro Exitoso! 🎉',
                msg: `Se han guardado tus datos y sumaste ${data.puntos} puntos.`,
                registro: nuevoRegistro
            });

        } catch (error: any) {
            console.error('💥 Error al procesar el reciclaje por WebSockets:', error.message);
            socket.emit('error-sistema', { msg: 'No se pudo procesar el registro de material' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
};
