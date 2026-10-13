import { Request, Response } from 'express';
import webpush from 'web-push';
import SuscripcionPush from '../models/suscripcionPush';

// Configuración global de WebPush con tus llaves criptográficas del .env
webpush.setVapidDetails(
    'mailto:mercadocreativo@gmail.com',
    process.env.VAPI_KEY_PUBLIC || process.env.VAPID_PUBLIC_KEY || '', 
    process.env.VAPI_KEY_PRIVATE || process.env.VAPID_PRIVATE_KEY || ''
);

/**
 * 📲 Guardar o actualizar la suscripción WebPush del dispositivo
 */
export const guardarSuscripcion = async (req: Request, res: Response) => {
    const suscripcionEntrante = req.body;
    const usuarioId = req.uid;

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
 * 🚀 MOTOR ENVIADOR GLOBAL ACTUALIZADO Y BLINDADO
 */
export const enviarNotificacionPushGlobal = async (
    titulo: string, 
    mensaje: string, 
    urlDestino: string = '/tabs/historial',
    tipoAviso: string = 'AVISO_GENERAL' // 🚀 Inyectamos el tipo de forma obligatoria
) => {
    try {
        const suscripciones = await SuscripcionPush.find({}).lean();

        if (suscripciones.length === 0) return;

        // El contrato estricto de Angular requiere la propiedad data para transferir variables en segundo plano
        const payloadJson = JSON.stringify({
            notification: {
                title: titulo,
                body: mensaje,
                icon: 'assets/icons/icon-72x72.png',
                badge: 'assets/icons/icon-72x72.png',
                vibrate: [200, 100, 200],
                data: { 
                    url: urlDestino,
                    tipo: tipoAviso // 🎯 Crucial para que las apps sepan qué icono pintar en caliente
                }
            }
        });

        const promesasEnvio = suscripciones.map((suscripcion: any) => {
            const pushConfig = {
                endpoint: suscripcion.endpoint,
                keys: {
                    p256dh: String(suscripcion.keys.p256dh).trim(),
                    auth: String(suscripcion.keys.auth).trim()
                }
            };
            return webpush.sendNotification(pushConfig, payloadJson).catch(() => {});
        });

        await Promise.all(promesasEnvio);
        console.log(`🚀 [WEBPUSH]: Mensaje masivo despachado con éxito.`);
    } catch (error: any) {
        console.error('💥 Error en motor push:', error.message);
    }
};