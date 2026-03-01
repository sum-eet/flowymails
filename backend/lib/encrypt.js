const crypto = require('crypto');

const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
if (process.env.ENCRYPTION_KEY && KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
}

// Format: iv(12 bytes hex):tag hex:encrypted hex
function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not set');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(data) {
  if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY not set');
  const [ivHex, tagHex, encHex] = data.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
