const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    initiatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    type: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },
    status: {
        type: String,
        enum: ['ongoing', 'ended', 'missed'],
        default: 'ongoing'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    },
    channelName: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

callSchema.index({ conversationId: 1 });
callSchema.index({ initiatorId: 1 });

module.exports = mongoose.model('Call', callSchema);

