//server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { encryptPresent, decryptPresent } = require('./presentCipher'); // Import PRESENT functions
const { generateKey, encryptMessage, decryptMessage } = require('./simonCipher'); // Import Simon functions

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const supabaseUrl = 'https://rcnuumcccjvoauqazreb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbnV1bWNjY2p2b2F1cWF6cmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTYyMjAsImV4cCI6MjA0ODg5MjIyMH0.uWyddJCKlxAkXr9epKtrAjRo25KDvVl9nB933i4Jj-E';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const { data, error } = await supabase
        .from('users')
        .insert([{ username, password }]); // Hash password before storing

    if (error) {
        console.error('Registration error:', error);
        return res.status(500).send('Registration failed');
    }

    res.send('Registration successful! You can now log in.');
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password) // Check hashed password
        .single();

    if (error || !data) {
        console.error('Login error:', error);
        return res.status(401).send('Invalid username or password');
    }

    // Store username in session or token (if using JWT)
    res.send('Login successful!'); // Redirect or send token
});

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
function encryptMessageWithCipher(message, SymmetricKey) {
//    if (!globalSymmetricKey) {
//        // Generate the symmetric key if not already generated
//        if (CIPHER_TYPE === 'present') {
//            globalSymmetricKey = crypto.randomBytes(10); // 80 bits for PRESENT
//        } else if (CIPHER_TYPE === 'simon') {
//            globalSymmetricKey = generateKey(); // Generate a 32-byte key for SIMON
//        }
//    }

    let encryptedMessage, iv;

    if (CIPHER_TYPE === 'present') {
        encryptedMessage = encryptPresent(message, SymmetricKey);
    } else if (CIPHER_TYPE === 'simon') {
        const result = encryptMessage(message, SymmetricKey);
        encryptedMessage = result.encryptedData;
        iv = result.iv; // Store IV for SIMON
    }

    const encryptedSymmetricKey = encryptSymmetricKey(SymmetricKey);
    return { encryptedMessage, encryptedSymmetricKey, iv };
}

// Function to decrypt a message using the chosen cipher
function decryptMessageWithCipher(encryptedMessage, SymmetricKey, iv) {

    if (CIPHER_TYPE === 'present') {
        return decryptPresent(encryptedMessage, SymmetricKey);
    } else if (CIPHER_TYPE === 'simon') {
        return decryptMessage(encryptedMessage, SymmetricKey, Buffer.from(iv, 'base64'));
    } else {
        throw new Error('Unsupported cipher type');
    }
}

// Route to get the public key
app.get('/public-key', (req, res) => {
    res.send(publicKey);
});

// Encryption route
app.post('/encrypt', async (req, res) => {
    const { message, username, message_id } = req.body;
    const symmetricKey = generateKey();

    console.log('key:', symmetricKey);

    console.log('message_id encrypted:', message_id);

    try {
        const result = encryptMessageWithCipher(message, symmetricKey);

        // Store globally
        globalEncryptedMessage = result.encryptedMessage;
        globalIv = result.iv; // Only for SIMON

        // Insert message into Supabase
        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    message_id: message_id,
                    username: username,
                    encrypted_message: globalEncryptedMessage,
                    iv: globalIv,
                    encrypted_symmetric_key: result.encryptedSymmetricKey,
                    timestamp: new Date().toISOString() // Use current timestamp
                }
            ]).single();

        if (error) {
            console.error('Error inserting message into Supabase:', error);
            return res.status(500).send('Failed to store message in database');
        }

        console.log('iv while encrypting text:', globalIv);
        //console.log('Encryption time 2:', encryptionTime);
        console.log('key while encrypting text:', result.encryptedSymmetricKey);

        res.send({
            encryptedMessage: globalEncryptedMessage,
            encryptedSymmetricKey: result.encryptedSymmetricKey,
            iv: globalIv,
            encrypted_symmetric_key: result.encryptedSymmetricKey,
            message_id: message_id,
        });
    } catch (error) {
        console.error('Encryption error:', error);
        res.status(500).send('Encryption failed');
    }
});

// Decryption route
app.post('/decrypt', async (req, res) => {
    const { message_id } = req.body; // Get username and timestamp from the request body

    console.log('message_id decrypted:', message_id);

    try {
        // Fetch the encrypted message from the database using the username and timestamp
        
        const { data, error } = await supabase
            .from('messages')
            .select('encrypted_message, encrypted_symmetric_key, iv')
            .eq('message_id', message_id) // Match the messageId
            .single(); // Fetch a single record

        if (error) {
            console.error('Error fetching message from Supabase:', error);
            return res.status(500).send('Failed to fetch message from database');
        }

        if (!data) {
            return res.status(404).send('Message not found');
        }

        const { encrypted_message, encrypted_symmetric_key, iv } = data; // Extract the encrypted message and key
        console.log('encrypted message:', encrypted_message);
        //const iv = encrypted_message.iv; // Extract the initialization vector

        console.log('getting iv from cloud:', iv);

        console.log('IV Buffer Length:', Buffer.from(iv, 'base64').length);

        console.log('key from cloud:', encrypted_symmetric_key);

        // Decrypt the message using the retrieved symmetric key
        const decryptedMessage = decryptMessageWithCipher(encrypted_message, decryptSymmetricKey(encrypted_symmetric_key), iv);

        res.send({ decryptedMessage});
    } catch (error) {
        console.error('Decryption error:', error);
        res.status(500).send('Decryption failed');
    }
});

// Serve static files
app.use(express.static(__dirname));

// Basic route to serve the chat interface
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Handle WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (data) => {
        const timestamp = new Date().toLocaleTimeString();
        io.emit('chat message', {
            username: data.username,
            message: data.message,
            message_id : data.message_id,
            iv: data.iv,
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