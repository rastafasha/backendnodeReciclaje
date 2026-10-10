import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Usuario from '../models/usuario';
import { generarJWT } from '../helpers/jwt';

// Función simulada simulando tu lógica real de verificación de Google
const googleVerify = async (token: string) => {
  // Aquí irá tu verificación real con la librería google-auth-library
  return { name: 'Google User', email: 'user@google.com', picture: 'url-to-image' };
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await Usuario.findOne({ email });

    if (!user || !user.password) {
      return res.status(404).json({
        ok: false,
        msg: 'Email no encontrado'
      });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        ok: false,
        msg: 'Contraseña no válida'
      });
    }

    // Generar JWT
    const token = await generarJWT(user.id);

    res.json({
      ok: true,
      token,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      msg: 'Error interno, hable con el administrador'
    });
  }
};

export const googleSignIn = async (req: Request, res: Response) => {
  const googleToken = req.body.token;

  try {
    const { name, email, picture } = await googleVerify(googleToken);
    const user = await Usuario.findOne({ email });
    let usuario;

    if (!user) {
      usuario = new Usuario({
        username: name, // mapeado a tu campo username de la DB
        email,
        password: '@@@',
        google: true
      });
    } else {
      usuario = user;
      usuario.google = true;
    }

    await usuario.save();
    const token = await generarJWT(usuario.id);

    res.json({
      ok: true,
      token,
      user: usuario
    });

  } catch (error) {
    res.status(401).json({
      ok: false,
      msg: 'Token de Google no es correcto',
    });
  }
};

export const renewToken = async (req: Request, res: Response) => {
  const uid = req.uid;

  if (!uid) {
    return res.status(400).json({ ok: false, msg: 'No se encontró el UID en la petición' });
  }

  const token = await generarJWT(uid);
  const user = await Usuario.findById(uid);

  res.json({
    ok: true,
    token,
    user
  });
};
