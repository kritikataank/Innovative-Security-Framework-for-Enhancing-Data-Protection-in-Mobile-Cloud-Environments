// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const crypto = require('crypto');

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
    const { encryptedMessage } = req.body;

    // Decrypt the message using the private key
    try {
        const buffer = Buffer.from(encryptedMessage, 'base64');
        const decryptedMessage = crypto.privateDecrypt(privateKey, buffer);
        res.send({ decryptedMessage: decryptedMessage.toString('utf8') });
    } catch (error) {
        console.error('Decryption error:', error);
        res.status(500).send('Decryption failed');
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