// script.js
const socket = io();

let username = prompt("Enter your username:");
if (!username) {
    username = "Anonymous"; // Default username if none provided
}

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatBox = document.getElementById('chat-box');

// Enable the input and button after username is set
messageInput.disabled = false;
sendButton.disabled = false;

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        socket.emit('chat message', { username: username, message: message });
        messageInput.value = ''; // Clear input after sending
    }
});

socket.on('chat message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `[${data.timestamp}] ${data.username}: ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
});