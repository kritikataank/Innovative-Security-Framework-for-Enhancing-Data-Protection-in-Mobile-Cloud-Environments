// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    originalMessage: { type: String, required: true }, // Field to store the original message
    encryptedMessage: { type: String, required: true },
    encryptedSymmetricKey: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;