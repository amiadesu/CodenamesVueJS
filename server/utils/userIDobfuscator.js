const crypto = require('crypto');

function deriveKey(keyString) {
    return crypto.createHash('sha256').update(keyString).digest().subarray(0, 16);
}

function validateUserId(id) {
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        throw new Error('Invalid ObjectID format. Must be 24 hex characters.');
    }
}

const IV = Buffer.alloc(16, 0); // fixed 16-byte IV (all zeros)

function encodeUserId(objectIdHex, keyString) {
    validateUserId(objectIdHex);
    const key = deriveKey(keyString);

    const data = Buffer.from(objectIdHex, 'hex');

    const cipher = crypto.createCipheriv('aes-128-ctr', key, IV);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    return encrypted.toString('hex');
}

function decodeUserId(obfuscatedHex, keyString) {
    validateUserId(obfuscatedHex);
    const key = deriveKey(keyString);

    const data = Buffer.from(obfuscatedHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-128-ctr', key, IV);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    return decrypted.toString('hex');
}

module.exports = {
    encodeUserId,
    decodeUserId,
};
