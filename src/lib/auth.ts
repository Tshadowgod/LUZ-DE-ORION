import { SignJWT, jwtVerify } from 'jose';

// Sin valor de respaldo a proposito: el que habia estaba escrito en el codigo
// y el repositorio es publico, asi que cualquiera podia firmar una cookie de
// admin valida. Si falta JWT_SECRET preferimos que no entre nadie.
const getSecret = () => {
  const clave = process.env.JWT_SECRET;
  if (!clave) throw new Error('Falta la variable JWT_SECRET');
  return new TextEncoder().encode(clave);
};

export const COOKIE_NAME = 'ldo_admin';

export async function createToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  return verifyToken(decodeURIComponent(match[1]));
}
