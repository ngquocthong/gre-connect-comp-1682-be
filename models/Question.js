const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: String,
    type: String,
    name: String,
    size: Number
}, { _id: false });

const questionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    views: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    attachments: [attachmentSchema]
}, {
    timestamps: true
});

questionSchema.index({ userId: 1 });
questionSchema.index({ isActive: 1, createdAt: -1 });
questionSchema.index({ tags: 1 });

module.exports = mongoose.model('Question', questionSchema);

