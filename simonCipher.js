// symmetricCipher.js
const { randomBytes, createCipheriv, createDecipheriv } = require('crypto');

// Generate a random symmetric key
function generateKey() {
    return randomBytes(32); // AES-256 requires a 32-byte key
}

// Encrypt a message using the symmetric key
function encryptMessage(message, key) {
    const iv = randomBytes(16); // Initialization vector
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(message, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { iv: iv.toString('base64'), encryptedData: encrypted };
}

// Decrypt a message using the symmetric key
function decryptMessage(encryptedMessage, key, iv) {
    const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(encryptedMessage, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { generateKey, encryptMessage, decryptMessage };