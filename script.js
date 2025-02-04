//script.js
const socket = io();
const { v4: uuidv4 } = uuid;

// script.js (in your chat interface)
let username = localStorage.getItem('username');
if (!username) {
    // Redirect to login page if not logged in
    window.location.href = 'login.html';
}
localStorage.removeItem('username'); // Replace 'keyName' with the actual key you want to remove

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatBox = document.getElementById('chat-box');
const uploadButton = document.getElementById('upload-button');
const fileUpload = document.getElementById('file-upload');
const cipherType = 'simon'; // 'simon' or 'present', depending on your choice
// const sendFileButton = document.getElementById('sendFileButton');

// Enable the input and button after username is set
messageInput.disabled = false;
sendButton.disabled = false;

// File upload button
//uploadButton.addEventListener('click', () => {
//    fileUpload.click();
//});

// Enable the input and button after username is set
messageInput.disabled = false;
sendButton.disabled = false;

function formatTimestamp(date) {
    const isoString = date.toISOString(); // Get the ISO string
    return isoString.replace('T', ' ').replace('Z', ''); // Replace 'T' with a space and remove 'Z'
}

let fileContentGlobal = ""; // Global variable to store file content
let flag = 0; // Flag variable

// File upload button functionality
uploadButton.addEventListener('click', () => {
    fileUpload.click(); // Trigger file selection
});

// File input change event to read file content
fileUpload.addEventListener('change', (event) => {
    const file = event.target.files[0]; // Get the selected file

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            fileContentGlobal = e.target.result.trim(); // Store file content in global variable

            // console.log("File content stored in global variable:", fileContentGlobal);
            // console.log("Flag value:", flag);
        };

        reader.readAsText(file); // Read the file as a text string
    }
});

sendButton.addEventListener('click', async () => {
    // Set flag based on content
    flag = fileContentGlobal ? 1 : 0;
    const message = fileContentGlobal || messageInput.value;
    const message_id = uuidv4(); // Generate a unique ID
    fileContentGlobal = "";

    //console.log('message_id generated:', message_id);

    if (message) {
        // Send the message to the server for encryption
        // Capture the current timestamp when the message is sent
        const timestamp = new Date(); // Format: YYYY-MM-DDTHH:mm:ss.sssZ
        const startTime = performance.now(); // Start time for encryption

        try {
            const response = await fetch('/encrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, username, cipherType, timestamp, message_id,}), // Include cipherType in the request body
            });

            if (response.ok) {
                const { message_id, encryptedMessage, encryptedSymmetricKey, iv } = await response.json();
                const endTime = performance.now(); // End time for encryption
                const encryptionTime = (endTime - startTime).toFixed(2); // Calculate encryption time
                // Emit the encrypted message to the chat
                socket.emit('chat message', { username: username, message: encryptedMessage, encryptedSymmetricKey, message_id, iv, timestamp, encryptionTime});
                console.log('Encryption time (%s): %d ms', cipherType, encryptionTime);
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
    //messageElement.textContent = `[${data.timestamp}] ${data.username}: ${data.message}`;

    // Create a decrypt button
    const decryptButton = document.createElement('button');
    decryptButton.textContent = flag === 1 ? 'Decrypt File' : 'Decrypt Message';
    // decryptButton.textContent = 'Decrypt';
    
    // Store username and timestamp in the button's dataset for easy access
    decryptButton.dataset.username = data.username; // Store username
    decryptButton.dataset.timestamp = data.timestamp; // Store timestamp
    decryptButton.dataset.encryptionTime = data.encryptionTime;

    // Store the message ID in the button's dataset
    decryptButton.dataset.message_id = data.message_id; // Store message ID

    //console.log('message_id when chat is showed:', decryptButton.dataset.message_id);

    decryptButton.dataset.iv = data.iv;

    //console.log('iv when chat is showed:', decryptButton.dataset.iv);

    decryptButton.addEventListener('click', async () => {
        const startTime = performance.now(); // Start time for decryption
        // Send the username and timestamp to the server for decryption
        try {
            const response = await fetch('/decrypt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username: decryptButton.dataset.username, // Get username from button's dataset
                    timestamp: decryptButton.dataset.timestamp, // Get timestamp from button's dataset
                    message_id: decryptButton.dataset.message_id, // Get message ID from button's dataset
                    iv: decryptButton.dataset.iv,// initalization vector
                    encryptionTime: decryptButton.dataset.encryptionTime             
                }),
            });

            if (response.ok) {
                const { decryptedMessage } = await response.json();
                const endTime = performance.now(); // End time for decryption
                const decryptionTime = (endTime - startTime).toFixed(2); // Calculate decryption time
                console.log('Decryption time (%s): %d ms', cipherType, decryptionTime);
                messageElement.textContent = `[${data.timestamp}] ${data.username}: ${decryptedMessage}`;
                //messageElement.textContent = `[${data.timestamp}] ${data.username}: ${decryptedMessage} E: ${decryptButton.dataset.encryptionTime} ms D: ${decryptionTime} ms`;
                //alert(`Decrypted Message: ${decryptedMessage}`); // Show decrypted message
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