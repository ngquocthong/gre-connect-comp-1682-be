const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profilePicture: {
        type: String,
        default: 'https://i.pravatar.cc/150'
    },
    bio: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'staff'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPending: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    fcmToken: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

