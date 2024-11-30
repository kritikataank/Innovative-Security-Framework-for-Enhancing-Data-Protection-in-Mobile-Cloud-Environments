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

// Main function to demonstrate the process
function main() {
    const message = "Hello, this is a secret message!";
    
    // Step 1: Choose a cipher (PRESENT or SIMON)
    const cipherType = 'simon'; // Change to 'present' to use PRESENT

    // Step 2: Use a predefined symmetric key
    let symmetricKey;
    let iv; // Declare iv here for scope
    if (cipherType === 'present') {
        symmetricKey = crypto.randomBytes(10); // 80 bits for PRESENT
    } else if (cipherType === 'simon') {
        symmetricKey = generateKey(); // Generate a 32-byte key for SIMON
    } else {
        throw new Error('Unsupported cipher type');
    }

    // Step 3: Encrypt the message with the symmetric key
    let encryptedMessage;
    if (cipherType === 'present') {
        // Convert the message to a string before passing it to encryptPresent
        const plainText = message; // Convert buffer to string
        encryptedMessage = encryptPresent(plainText, symmetricKey);
        console.log('Encrypted Message (PRESENT):', encryptedMessage.toString(16)); // Display as hex
    } else if (cipherType === 'simon') {
        const result = encryptMessage(message, symmetricKey);
        encryptedMessage = result.encryptedData;
        iv = result.iv; // Initialization vector returned by the encryption
        console.log('Encrypted Message (SIMON):', encryptedMessage);
    }

    // Step 4: Encrypt the symmetric key using RSA
    const encryptedSymmetricKey = encryptSymmetricKey(symmetricKey);
    console.log('Encrypted Symmetric Key:', encryptedSymmetricKey);

    // Step 5: Decrypt the symmetric key using RSA
    const decryptedSymmetricKey = decryptSymmetricKey(encryptedSymmetricKey);
    console.log('Decrypted Symmetric Key:', decryptedSymmetricKey.toString('hex'));

    // Step 6: Decrypt the message using the decrypted symmetric key
    let decryptedMessage;
    if (cipherType === 'present') {
        decryptedMessage = decryptPresent(encryptedMessage, decryptedSymmetricKey);
        console.log('Decrypted Message (PRESENT):', decryptedMessage);
    } else if (cipherType === 'simon') {
        decryptedMessage = decryptMessage(encryptedMessage, decryptedSymmetricKey, iv); // Use iv defined earlier
        console.log('Decrypted Message (SIMON):', decryptedMessage);
    }
}

// Execute the main function
main();