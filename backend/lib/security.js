const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const TOKEN_VERSION = 1;
const HASH_PREFIX = 'scrypt';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function isPasswordHashed(value) {
  return typeof value === 'string' && value.startsWith(`${HASH_PREFIX}$`);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(String(password), salt, 64);
  return `${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  if (!isPasswordHashed(storedPassword)) {
    return String(password) === storedPassword;
  }

  const [, salt, expectedHash] = storedPassword.split('$');
  const derivedKey = await scrypt(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (expectedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, derivedKey);
}

function signToken(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function createAuthToken(user, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const issuedAt = Date.now();
  const body = Buffer.from(JSON.stringify({
    v: TOKEN_VERSION,
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_MS,
  })).toString('base64url');
  const signature = signToken(`${header}.${body}`, secret);

  return `${header}.${body}.${signature}`;
}

function verifyAuthToken(token, secret) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const [header, body, signature] = token.split('.');

  if (!header || !body || !signature) {
    return null;
  }

  const expectedSignature = signToken(`${header}.${body}`, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

module.exports = {
  createAuthToken,
  hashPassword,
  isPasswordHashed,
  verifyAuthToken,
  verifyPassword,
};
