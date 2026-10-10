import { Schema, model, Model } from 'mongoose';

export type TipoNotificacion = 'NUEVO_RECICLAJE' | 'RECOMPENSA_CANJEADA' | 'LOGRO_DESBLOQUEADO' | 'AVISO_GENERAL';

export interface INotificacion {
    usuario?: Schema.Types.ObjectId; // Si está presente, es privada para un reciclador
    titulo: string;
    mensaje: string;
    tipo: TipoNotificacion;
    leido: boolean;
    referenciaId?: Schema.Types.ObjectId; // ID del material reciclado o premio asociado
    createdAt: Date;
    updatedAt: Date;
}

const notificacionSchema = new Schema({
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: false },
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    tipo: { 
        type: String, 
        enum: ['NUEVO_RECICLAJE', 'RECOMPENSA_CANJEADA', 'LOGRO_DESBLOQUEADO', 'AVISO_GENERAL'],
        required: true 
    },
    leido: { type: Boolean, default: false },
    referenciaId: { type: Schema.Types.ObjectId, required: false },
}, { timestamps: true, collection: 'app_notificaciones' });

// Índice compuesto para acelerar drásticamente la campana en Ionic
notificacionSchema.index({ usuario: 1, leido: 1, createdAt: -1 });

export default model('Notificacion', notificacionSchema) as unknown as Model<INotificacion>;
