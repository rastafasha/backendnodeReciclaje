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
    usuarioId?: string
) => {
    try {
        const filtro = usuarioId ? { usuario: usuarioId as any } : {};
        
        // 🚀 MEJORA DE RENDIMIENTO: Usamos .lean() para saltarnos el envoltorio de Mongoose 
        // y recuperar objetos planos de javascript (JSON limpios de Atlas)
        const suscripciones = await SuscripcionPush.find(filtro).lean();

        if (suscripciones.length === 0) {
            console.log('⚠️ [WEBPUSH]: No existen terminales inscritos en la base de datos para recibir el Push.');
            return;
        }

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
            // 🛡️ ADUANA DE SEGURIDAD INTERNA: Si por algún fallo del cliente las llaves no se guardaron, saltamos el registro
            if (!suscripcion.keys || !suscripcion.keys.p256dh || !suscripcion.keys.auth) {
                console.log('🧹 [WEBPUSH]: Saltando registro corrupto sin llaves criptográficas.');
                return Promise.resolve();
            }

            // Estructuramos el contrato plano exacto que la librería web-push puede procesar sin explotar
            const pushConfig = {
                endpoint: suscripcion.endpoint,
                keys: {
                    p256dh: String(suscripcion.keys.p256dh).trim(),
                    auth: String(suscripcion.keys.auth).trim()
                }
            };

            return webpush.sendNotification(pushConfig, payloadJson)
                .then(() => {
                    console.log(`🎯 Mensaje entregado con éxito al endpoint: ${suscripcion.endpoint.substring(0, 30)}...`);
                })
                .catch(async (err: any) => { 
                    // Si el token ya expiró, Google/Mozilla nos devuelven un 410 o 404 de inmediato
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log('🧹 [WEBPUSH]: Token expirado o revocado en el dispositivo. Eliminando de Atlas...');
                        return SuscripcionPush.deleteOne({ _id: suscripcion._id });
                    }
                    console.error('⚠️ Error enviando a dispositivo individual:', err.message);
                });
        });

        await Promise.all(promesasEnvio);
        console.log(`🚀 [WEBPUSH PROD]: Despacho masivo concluido. Total terminales procesados: ${suscripciones.length}.`);
    } catch (error: any) {
        console.error('💥 Fallo crítico en el core del motor WebPush:', error.message);
    }
};