import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { BACKUP_MAX_BYTES } from './backup-format.mjs';

const magic = Buffer.from('TEBK0001', 'ascii');
const aad = Buffer.from('tech-echo-durable-identity-snapshot:v1', 'utf8');
const ivBytes = 12;
const tagBytes = 16;

function encryptionKey() {
  const encoded = process.env.BACKUP_ENCRYPTION_KEY_V1?.trim() || '';
  if (!/^[A-Za-z0-9+/]{43}=$/.test(encoded)) {
    throw new Error('invalid key');
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64') !== encoded) {
    key.fill(0);
    throw new Error('invalid key');
  }
  return key;
}

function privateWrite(path, data) {
  writeFileSync(path, data, { flag: 'wx', mode: 0o600 });
}

function boundedRead(path, maximumBytes) {
  if (statSync(path).size > maximumBytes) throw new Error('file too large');
  return readFileSync(path);
}

function encrypt(inputPath, outputPath) {
  const key = encryptionKey();
  const plaintext = boundedRead(inputPath, BACKUP_MAX_BYTES);
  let compressed;
  try {
    compressed = gzipSync(plaintext, { level: 9 });
    const iv = randomBytes(ivBytes);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: tagBytes });
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
    const tag = cipher.getAuthTag();
    privateWrite(outputPath, Buffer.concat([magic, iv, tag, ciphertext]));
    ciphertext.fill(0);
  } finally {
    key.fill(0);
    plaintext.fill(0);
    compressed?.fill(0);
  }
}

function decrypt(inputPath, outputPath) {
  const key = encryptionKey();
  const payload = boundedRead(inputPath, BACKUP_MAX_BYTES + 64 * 1024);
  let compressed;
  let plaintext;
  try {
    const headerBytes = magic.length + ivBytes + tagBytes;
    if (payload.length <= headerBytes || !payload.subarray(0, magic.length).equals(magic)) {
      throw new Error('invalid backup');
    }
    const ivStart = magic.length;
    const tagStart = ivStart + ivBytes;
    const ciphertextStart = tagStart + tagBytes;
    const iv = payload.subarray(ivStart, tagStart);
    const tag = payload.subarray(tagStart, ciphertextStart);
    const ciphertext = payload.subarray(ciphertextStart);
    const decipher = createDecipheriv('aes-256-gcm', key, iv, {
      authTagLength: tagBytes,
    });
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    compressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    plaintext = gunzipSync(compressed, { maxOutputLength: BACKUP_MAX_BYTES });
    privateWrite(outputPath, plaintext);
  } finally {
    key.fill(0);
    payload.fill(0);
    compressed?.fill(0);
    plaintext?.fill(0);
  }
}

const [mode, inputPath, outputPath] = process.argv.slice(2);
try {
  if (!['encrypt', 'decrypt'].includes(mode) || !inputPath || !outputPath) {
    throw new Error('usage');
  }
  if (mode === 'encrypt') encrypt(inputPath, outputPath);
  else decrypt(inputPath, outputPath);
  console.log(
    mode === 'encrypt' ? 'Encrypted backup created.' : 'Encrypted backup opened.',
  );
} catch {
  console.error(
    mode === 'encrypt' ? 'Backup encryption failed.' : 'Backup decryption failed.',
  );
  process.exitCode = 1;
}
