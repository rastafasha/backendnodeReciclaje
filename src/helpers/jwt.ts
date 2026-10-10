import jwt from 'jsonwebtoken';

export const generarJWT = (uid: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const payload = { uid };

    // Se lee la firma secreta de las variables de entorno
    const secret = process.env.JWT_SECRET || 'fallback-secret-key';

    jwt.sign(
      payload, 
      secret, 
      { expiresIn: '90h' }, 
      (err, token) => {
        if (err || !token) {
          console.error(err);
          reject('No se pudo generar el JWT');
        } else {
          resolve(token);
        }
      }
    );
  });
};
