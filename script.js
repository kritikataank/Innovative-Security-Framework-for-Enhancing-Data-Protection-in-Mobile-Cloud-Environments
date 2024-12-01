const socket = io();

let username = prompt("Enter your username:");
if (!username) {
    username = "Anonymous"; // Default username if none provided
}

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatBox = document.getElementById('chat-box');
const uploadButton = document.getElementById('upload-button');
const fileUpload = document.getElementById('file-upload');

// File upload button
uploadButton.addEventListener('click', () => {
    fileUpload.click();
});

// Enable the input and button after username is set
messageInput.disabled = false;
sendButton.disabled = false;

sendButton.addEventListener('click', async () => {
    const message = messageInput.value;
    const cipherType = 'simon'; // or 'present', depending on your choice

    if (message) {
        // Send the message to the server for encryption
        try {
            const response = await fetch('/encrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, cipherType }), // Include cipherType in the request body
            });

            if (response.ok) {
                const { encryptedMessage, encryptedSymmetricKey, iv } = await response.json();
                // Emit the encrypted message to the chat
                socket.emit('chat message', { username: username, message: encryptedMessage, encryptedSymmetricKey, iv });
                messageInput.value = ''; // Clear input after sending
            } else {
                console.error('Encryption failed');
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    }
});

socket.on('chat message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `[${data.timestamp}] ${data.username}: ${data.message}`;

    // Create a decrypt button
    const decryptButton = document.createElement('button');
    decryptButton.textContent = 'Decrypt';
    decryptButton.addEventListener('click', async () => {
        // Send the encrypted message and symmetric key to the server for decryption
        try {
            const response = await fetch('/decrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    encryptedMessage: data.message,
                    encryptedSymmetricKey: data.encryptedSymmetricKey,
                    iv: data.iv // Include IV for decryption if using SIMON
                }),
            });

            if (response.ok) {
                const { decryptedMessage } = await response.json();
                alert(`Decrypted Message: ${decryptedMessage}`); // Show decrypted message
            } else {
                console.error('Decryption failed');
            }
        } catch (error) {
            console.error('Error during fetch:', error);
        }
    });

    // Append the decrypt button to the message element
    messageElement.appendChild(decryptButton);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
});