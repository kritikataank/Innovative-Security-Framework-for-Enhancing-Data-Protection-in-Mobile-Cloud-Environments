//generateKeyPair.js
const { generateKeyPair: _generateKeyPair } = require('crypto');
const { writeFileSync } = require('fs');

// Function to generate RSA key pair
function generateKeyPair() {
    // Generate the key pair
    _generateKeyPair('rsa', {
        modulusLength: 2048, // Key size in bits
        publicKeyEncoding: {
            type: 'spki', // Recommended for public key
            format: 'pem' // PEM format
        },
        privateKeyEncoding: {
            type: 'pkcs8', // Recommended for private key
            format: 'pem' // PEM format
        }
    }, (err, publicKey, privateKey) => {
        if (err) {
            console.error('Error generating key pair:', err);
            return;
        }

        // Save the private key to a secure location
        writeFileSync('privateKey.pem', privateKey);
        console.log('Private key saved to privateKey.pem');

        // Save the public key to a file or return it to be used in the server
        writeFileSync('publicKey.pem', publicKey);
        console.log('Public key saved to publicKey.pem');
    });
}

// Call the function to generate the RSA key pair
generateKeyPair();