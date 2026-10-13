import { Request, Response } from 'express';
import webpush from 'web-push';
import SuscripcionPush from '../models/suscripcionPush';

// Configuración global de WebPush con tus llaves criptográficas del .env
webpush.setVapidDetails(
    'mailto:mercadocreativo@gmail.com',
    process.env.VAPI_KEY_PUBLIC || '', // Forzamos strings vacíos si falla la lectura
    process.env.VAPI_KEY_PRIVATE || ''
);

/**
 * 📲 Guardar o actualizar la suscripción WebPush del dispositivo
 */
export const guardarSuscripcion = async (req: Request, res: Response) => {
    const suscripcionEntrante = req.body;
    const usuarioId = req.uid; // Extraído de tu validarJWT si está logueado

    if (!suscripcionEntrante || !suscripcionEntrante.endpoint) {
        return res.status(400).json({ ok: false, msg: 'La suscripción no contiene un endpoint válido.' });
    }

    try {
        await SuscripcionPush.findOneAndUpdate(
            { endpoint: suscripcionEntrante.endpoint },
            { ...suscripcionEntrante, usuario: usuarioId || null },
            { upsert: true, new: true }
        );

        return res.status(201).json({ 
            ok: true, 
            msg: 'Dispositivo enlazado con éxito en MongoDB para WebPush ♻️' 
        });
    } catch (error: any) {
        console.error('❌ [WEBPUSH BACKEND ERROR]:', error.message);
        return res.status(500).json({ ok: false, error: error.toString() });
    }
};

/**
 * 🚀 MOTOR ENVIADOR GLOBAL: Despacha alertas a perfiles específicos o a todos
 */
export const enviarNotificacionPushGlobal = async (
    titulo: string, 
    mensaje: string, 
    urlDestino: string = '/tabs/historial',
    usuarioId?: string
) => {
    try {
        // Si viene un usuarioId, enviamos solo a sus dispositivos, si no, a todos (Aviso General)
        const filtro = usuarioId ? { usuario: usuarioId as any } : {};
        const suscripciones = await SuscripcionPush.find(filtro);

        const payloadJson = JSON.stringify({
            notification: {
                title: titulo,
                body: mensaje,
                icon: 'assets/icons/icon-72x72.png',
                badge: 'assets/icons/icon-72x72.png',
                vibrate:[200, 100, 200],
                data: { url: urlDestino }
            }
        });

        const promesasEnvio = suscripciones.map((suscripcion: any) => {
            // 🟢 CORRECCIÓN CRÍTICA: Estructuramos el objeto JSON plano y limpio que requiere webpush
            // extrayendo endpoint y las llaves del documento físico de Atlas
            const pushConfig = {
                endpoint: suscripcion.endpoint,
                keys: {
                    p256dh: suscripcion.keys.p256dh,
                    auth: suscripcion.keys.auth
                }
            };

            return webpush.sendNotification(pushConfig, payloadJson)
                .catch(async (err: any) => { 
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log('🧹 [WEBPUSH]: Token expirado o revocado. Limpiando registro de Mongo...');
                        return SuscripcionPush.deleteOne({ _id: suscripcion._id });
                    }
                    console.error('⚠️ Error enviando a dispositivo individual:', err.message);
                });
        });

        await Promise.all(promesasEnvio);
        console.log(`🚀 [WEBPUSH]: Alerta Push enviada con éxito a ${suscripciones.length} terminales.`);
    } catch (error: any) {
        console.error('💥 Fallo crítico en el motor WebPush:', error.message);
    }
};