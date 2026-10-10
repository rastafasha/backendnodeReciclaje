import { Schema, model, Model } from 'mongoose';

export interface ISuscripcionPush {
    usuario?: Schema.Types.ObjectId; // Enlazamos la suscripción al usuario para segmentar envíos
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
    fechaRegistro: Date;
}

const suscripcionPushSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
    endpoint: { type: String, required: true, unique: true },
    expirationTime: { type: Number, default: null },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'suscripciones_push' });

export default model('SuscripcionPush', suscripcionPushSchema) as unknown as Model<ISuscripcionPush>;
