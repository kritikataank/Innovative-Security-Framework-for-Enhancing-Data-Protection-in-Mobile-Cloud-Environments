// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const crypto = require('crypto');
const { 
    encryptSymmetricKey, 
    decryptSymmetricKey, 
    encryptMessageWithCipher, 
    decryptMessageWithCipher 
} = require('./encryptDecrypt'); // Import necessary functions

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Load the public and private keys
const publicKey = fs.readFileSync('publicKey.pem', 'utf8');
const privateKey = fs.readFileSync('privateKey.pem', 'utf8');

// Middleware to parse JSON requests
app.use(express.json());

// Route to get the public key
app.get('/public-key', (req, res) => {
    res.send(publicKey);
});

// Example route to demonstrate decryption (for testing purposes)
app.post('/decrypt', (req, res) => {
    const { encryptedMessage, encryptedSymmetricKey } = req.body; // Expecting encrypted message, symmetric key, cipher type, and IV
    const cipherType = 'simon';
    const iv = encryptMessage(message, encryptedSymmetricKey).iv;
    // Decrypt the symmetric key using the private key
    let symmetricKey;
    try {
        symmetricKey = decryptSymmetricKey(encryptedSymmetricKey); // Decrypt the symmetric key
    } catch (error) {
        console.error('Symmetric key decryption error:', error);
        return res.status(500).send('Symmetric key decryption failed');
    }

    // Decrypt the message using the decrypted symmetric key
    let decryptedMessage;
    try {
        decryptedMessage = decryptMessageWithCipher(encryptedMessage, symmetricKey, cipherType, iv); // Use the correct decryption function
        res.send({ decryptedMessage: decryptedMessage });
    } catch (error) {
        console.error('Message decryption error:', error);
        res.status(500).send('Message decryption failed');
    }
});

// New route to handle encryption
app.post('/encrypt', (req, res) => {
    const { message} = req.body; // Expecting cipherType from the client
    const cipherType = 'simon';
    // Encrypt the message using your encryption function
    try {
        const { encryptedMessage, encryptedSymmetricKey, iv } = encryptMessageWithCipher(message, cipherType);

        // Send back the encrypted message and the encrypted symmetric key
        res.send({ encryptedMessage, encryptedSymmetricKey, iv }); // Include iv for SIMON
    } catch (error) {
        console.error('Encryption error:', error);
        res.status(500).send('Encryption failed');
    }
});

app.use(express.static(__dirname));

// Basic route to serve the chat interface
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for chat messages from the client
    socket.on('chat message', (data) => {
        const timestamp = new Date().toLocaleTimeString();
        // Broadcast the message to all connected clients
        io.emit('chat message', { username: data.username, message: data.message, timestamp: timestamp });
    });

    socket.on('disconnect', () => {
        console.log('User  disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});