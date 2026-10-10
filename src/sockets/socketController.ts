import { Socket, Server } from 'socket.io';
import MaterialReciclado, { TipoMaterial } from '../models/material';
import { enviarNotificacionPushGlobal } from '../controllers/pushController';

export const socketController = (socket: Socket, io: Server) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('join-room', (uid: string) => {
        socket.join(uid);
        console.log(`🏠 Usuario [${uid}] se unió a su sala privada`);
    });

    // ⚡ EVENTO ACTUALIZADO: Recibe, guarda en Atlas y notifica
    socket.on('nuevo-reciclaje', async (data: {
        usuarioId: string;
        material: TipoMaterial;
        peso: number;
        puntos: number;
        detalle?: string;
    }) => {
        try {
            console.log(`♻️ Guardando reciclaje de ${data.material} para el usuario ${data.usuarioId}`);

            // 1. Crear e insertar el registro en MongoDB Atlas usando el Modelo TS
            const nuevoRegistro = new MaterialReciclado({
                usuario: data.usuarioId,
                tipo: data.material,
                pesoEnGramos: data.peso,
                puntosOtorgados: data.puntos,
                detalleOpcional: data.detalle
            });

            await nuevoRegistro.save();
            await enviarNotificacionPushGlobal(
                '¡Puntos Sumados! 🎉',
                `Has ganado ${data.puntos} puntos por tu reciclaje de ${data.material.toLowerCase()}.`,
                '/tabs/perfil', // Ruta de destino en Ionic
                data.usuarioId  // ID del reciclador para que solo le llegue a él
            );

            // 2. Emitir notificación en tiempo real a todo el sistema (Feed global)
            io.emit('feed-reciclaje', {
                mensaje: `¡Alguien acaba de reciclar ${data.material.toLowerCase()}! 🌎`,
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
            // Avisar al cliente emisor si algo falló
            socket.emit('error-sistema', { msg: 'No se pudo procesar el registro de material' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
};
