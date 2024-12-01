const fs = require('fs');
const crypto = require('crypto');
const { encryptPresent, decryptPresent } = require('./presentCipher'); // Import PRESENT functions
const { generateKey, encryptMessage, decryptMessage } = require('./simonCipher'); // Import Simon functions

// Load the public and private keys
const publicKey = fs.readFileSync('publicKey.pem', 'utf8'); // Load the public key from a file
const privateKey = fs.readFileSync('privateKey.pem', 'utf8'); // Load the private key from a file

// Function to encrypt the symmetric key using RSA
function encryptSymmetricKey(symmetricKey) {
    const encryptedKey = crypto.publicEncrypt(publicKey, symmetricKey); // Use public key to encrypt
    return encryptedKey.toString('base64');
}

// Function to decrypt the symmetric key using RSA
function decryptSymmetricKey(encryptedKey) {
    const buffer = Buffer.from(encryptedKey, 'base64');
    const decryptedKey = crypto.privateDecrypt(privateKey, buffer); // Use private key to decrypt
    return decryptedKey;
}

// Function to encrypt a message
function encryptMessageWithCipher(message, cipherType) {
    let symmetricKey;
    let iv; // Declare iv here for scope
    let encryptedMessage;

    if (cipherType === 'present') {
        symmetricKey = crypto.randomBytes(10); // 80 bits for PRESENT
        encryptedMessage = encryptPresent(message, symmetricKey);
    } else if (cipherType === 'simon') {
        symmetricKey = generateKey(); // Generate a 32-byte key for SIMON
        const result = encryptMessage(message, symmetricKey);
        encryptedMessage = result.encryptedData;
        iv = result.iv; // Initialization vector returned by the encryption
    } else {
        throw new Error('Unsupported cipher type');
    }

    // Encrypt the symmetric key using RSA
    const encryptedSymmetricKey = encryptSymmetricKey(symmetricKey);
    
    // Return both the encrypted message and the encrypted symmetric key
    return {
        encryptedMessage,
        encryptedSymmetricKey,
        iv, // Return iv if using SIMON
    };
}

// Function to decrypt a message
function decryptMessageWithCipher(encryptedMessage, encryptedSymmetricKey, cipherType, iv) {
    const decryptedSymmetricKey = decryptSymmetricKey(encryptedSymmetricKey);

    let decryptedMessage;
    if (cipherType === 'present') {
        decryptedMessage = decryptPresent(encryptedMessage, decryptedSymmetricKey);
    } else if (cipherType === 'simon') {
        decryptedMessage = decryptMessage(encryptedMessage, decryptedSymmetricKey, iv); // Use iv defined earlier
    }

    return decryptedMessage;
}

// Export functions
module.exports = {
    encryptSymmetricKey,
    decryptSymmetricKey,
    encryptMessageWithCipher,
    decryptMessageWithCipher,
};