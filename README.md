# CipherChat

CipherChat is a secure messaging application that allows users to send and receive encrypted messages using symmetric and asymmetric encryption techniques. The application supports two encryption algorithms: PRESENT and SIMON. This project utilizes Node.js for the backend and Socket.IO for real-time communication.

## Features
* Asymmetric Encryption: RSA is used to encrypt the symmetric keys for secure message transmission.
* Symmetric Encryption: Supports both PRESENT and SIMON block ciphers for message encryption.
* Real-time Messaging: Utilizes Socket.IO for real-time communication between users.
* File Upload: Allows users to upload files (feature currently not implemented in the backend).
* User -friendly Interface: Simple HTML interface for chatting.

## Technologies Used
* Node.js: JavaScript runtime for building the server-side application.
* Socket.IO: Library for real-time web applications to enable bi-directional communication.
* Crypto: Built-in Node.js module for cryptographic operations.
* HTML/CSS: For the frontend user interface.

## Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/CipherChat.git
cd CipherChat
```

Install the dependencies:

```bash
npm install
```

Generate RSA key pair:
Run the following command to generate the public and private keys:

```bash
node generateKeyPair.js
```

Start the server:

```bash
node server.js
```

Open your browser and navigate to http://localhost:3001.

## Usage
- Enter your username when prompted.
- Type your message in the input field and click "Send" to send an encrypted message.
- Other users will receive the encrypted message in real-time.
- Click the "Decrypt" button next to a message to decrypt it.

## License
This project is licensed under the MIT License. See the LICENSE file for details.
