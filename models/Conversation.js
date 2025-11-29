const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['direct', 'group'],
        default: 'direct'
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date
    },
    avatar: {
        type: String
    }
}, {
    timestamps: true
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageTime: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);

