const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const crypto = require('crypto');
const { encryptPresent, decryptPresent } = require('./presentCipher'); // Import PRESENT functions
const { generateKey, encryptMessage, decryptMessage } = require('./simonCipher'); // Import Simon functions

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Load the public and private keys
const publicKey = fs.readFileSync('publicKey.pem', 'utf8');
const privateKey = fs.readFileSync('privateKey.pem', 'utf8');

// Global variables
let globalSymmetricKey = null;
let globalEncryptedMessage = null;
let globalIv = null;
const CIPHER_TYPE = 'simon'; // Set the cipher type here (either 'simon' or 'present')

// Middleware to parse JSON requests
app.use(express.json());

// Function to encrypt the symmetric key using RSA
function encryptSymmetricKey(symmetricKey) {
    return crypto.publicEncrypt(publicKey, symmetricKey).toString('base64');
}

// Function to decrypt the symmetric key using RSA
function decryptSymmetricKey(encryptedKey) {
    const buffer = Buffer.from(encryptedKey, 'base64');
    return crypto.privateDecrypt(privateKey, buffer);
}

// Function to encrypt a message using the chosen cipher
function encryptMessageWithCipher(message) {
    if (!globalSymmetricKey) {
        // Generate the symmetric key if not already generated
        if (CIPHER_TYPE === 'present') {
            globalSymmetricKey = crypto.randomBytes(10); // 80 bits for PRESENT
        } else if (CIPHER_TYPE === 'simon') {
            globalSymmetricKey = generateKey(); // Generate a 32-byte key for SIMON
        }
    }

    let encryptedMessage, iv;

    if (CIPHER_TYPE === 'present') {
        encryptedMessage = encryptPresent(message, globalSymmetricKey);
    } else if (CIPHER_TYPE === 'simon') {
        const result = encryptMessage(message, globalSymmetricKey);
        encryptedMessage = result.encryptedData;
        iv = result.iv; // Store IV for SIMON
    }

    const encryptedSymmetricKey = encryptSymmetricKey(globalSymmetricKey);
    return { encryptedMessage, encryptedSymmetricKey, iv };
}

// Function to decrypt a message using the chosen cipher
function decryptMessageWithCipher(encryptedMessage, iv) {
    if (!globalSymmetricKey) {
        throw new Error('Symmetric key is not set');
    }

    if (CIPHER_TYPE === 'present') {
        return decryptPresent(encryptedMessage, globalSymmetricKey);
    } else if (CIPHER_TYPE === 'simon') {
        return decryptMessage(encryptedMessage, globalSymmetricKey, iv);
    } else {
        throw new Error('Unsupported cipher type');
    }
}

// Route to get the public key
app.get('/public-key', (req, res) => {
    res.send(publicKey);
});

// Encryption route
app.post('/encrypt', (req, res) => {
    const { message } = req.body;

    try {
        const result = encryptMessageWithCipher(message);

        // Store globally
        globalEncryptedMessage = result.encryptedMessage;
        globalIv = result.iv; // Only for SIMON

        res.send({
            encryptedMessage: globalEncryptedMessage,
            encryptedSymmetricKey: result.encryptedSymmetricKey,
            iv: globalIv,
        });
    } catch (error) {
        console.error('Encryption error:', error);
        res.status(500).send('Encryption failed');
    }
});

// Decryption route
app.post('/decrypt', (req, res) => {
    try {
        if (!globalEncryptedMessage) {
            return res.status(400).send('No encrypted message available for decryption.');
        }

        const decryptedMessage = decryptMessageWithCipher(globalEncryptedMessage, globalIv);

        res.send({ decryptedMessage });
    } catch (error) {
        console.error('Decryption error:', error);
        res.status(500).send('Decryption failed');
    }
});

// Serve static files
app.use(express.static(__dirname));

// Basic route to serve the chat interface
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (data) => {
        const timestamp = new Date().toLocaleTimeString();
        io.emit('chat message', {
            username: data.username,
            message: data.message,
            timestamp: timestamp,
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});