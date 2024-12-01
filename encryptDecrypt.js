const crypto = require('crypto');
const { encryptPresent, decryptPresent } = require('./presentCipher'); // Import PRESENT functions
const { generateKey, encryptMessage, decryptMessage } = require('./simonCipher'); // Import Simon functions

const fs = require('fs');
const publicKey = fs.readFileSync('publicKey.pem', 'utf8'); // Load public key
const privateKey = fs.readFileSync('privateKey.pem', 'utf8'); // Load private key

// Encrypt symmetric key with RSA
function encryptSymmetricKey(symmetricKey) {
    const encryptedKey = crypto.publicEncrypt(publicKey, symmetricKey);
    return encryptedKey.toString('base64');
}

// Decrypt symmetric key with RSA
function decryptSymmetricKey(encryptedKey) {
    const buffer = Buffer.from(encryptedKey, 'base64');
    const decryptedKey = crypto.privateDecrypt(privateKey, buffer);
    return decryptedKey;
}

// Encrypt a message with chosen cipher
function encryptMessageWithCipher(message, cipherType) {
    let symmetricKey;
    let iv = null;
    let encryptedMessage;

    // Generate symmetric key
    if (cipherType === 'present') {
        symmetricKey = crypto.randomBytes(10); // 80 bits for PRESENT
        encryptedMessage = encryptPresent(message, symmetricKey);
    } else if (cipherType === 'simon') {
        symmetricKey = generateKey(); // Generate a 32-byte key for SIMON
        const result = encryptMessage(message, symmetricKey);
        encryptedMessage = result.encryptedData;
        iv = result.iv; // Store IV for decryption
    } else {
        throw new Error('Unsupported cipher type');
    }

    // Encrypt symmetric key
    const encryptedSymmetricKey = encryptSymmetricKey(symmetricKey);

    return { encryptedMessage, encryptedSymmetricKey, iv };
}

// Decrypt a message with chosen cipher
function decryptMessageWithCipher(encryptedMessage, symmetricKey, cipherType, iv = null) {
    if (cipherType === 'present') {
        return decryptPresent(encryptedMessage, symmetricKey);
    } else if (cipherType === 'simon') {
        return decryptMessage(encryptedMessage, symmetricKey, iv);
    } else {
        throw new Error('Unsupported cipher type');
    }
}

module.exports = {
    encryptSymmetricKey,
    decryptSymmetricKey,
    encryptMessageWithCipher,
    decryptMessageWithCipher,
};
