const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const socketHandler = (io) => {
  const userSockets = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    userSockets.set(socket.userId, socket.id);

    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, type, attachments } = data;

        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          content,
          type: type || 'text',
          attachments: attachments || [],
          readBy: [socket.userId]
        });

        await message.populate('senderId', 'firstName lastName profilePicture username');

        const conversation = await Conversation.findById(conversationId);
        conversation.lastMessage = content;
        conversation.lastMessageTime = Date.now();
        await conversation.save();

        io.to(`conversation:${conversationId}`).emit('new-message', message);

        conversation.participants.forEach(participantId => {
          const participantSocketId = userSockets.get(participantId.toString());
          if (participantSocketId && participantId.toString() !== socket.userId) {
            io.to(participantSocketId).emit('conversation-updated', conversation);
          }
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing-start', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('typing-stop', (conversationId) => {
      socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        userId: socket.userId
      });
    });

    socket.on('message-read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: socket.userId }
        });

        socket.to(`conversation:${conversationId}`).emit('message-read-update', {
          messageId,
          userId: socket.userId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('call-initiate', (data) => {
      const { conversationId, type, participants } = data;

      participants.forEach(participantId => {
        const participantSocketId = userSockets.get(participantId);
        if (participantSocketId && participantId !== socket.userId) {
          io.to(participantSocketId).emit('incoming-call', {
            conversationId,
            type,
            caller: {
              id: socket.userId,
              name: `${socket.user.firstName} ${socket.user.lastName}`,
              avatar: socket.user.profilePicture
            }
          });
        }
      });
    });

    socket.on('call-accept', (data) => {
      const { conversationId, callerId } = data;
      const callerSocketId = userSockets.get(callerId);

      if (callerSocketId) {
        io.to(callerSocketId).emit('call-accepted', {
          conversationId,
          acceptedBy: socket.userId
        });
      }
    });

    socket.on('call-reject', (data) => {
      const { conversationId, callerId } = data;
      const callerSocketId = userSockets.get(callerId);

      if (callerSocketId) {
        io.to(callerSocketId).emit('call-rejected', {
          conversationId,
          rejectedBy: socket.userId
        });
      }
    });

    socket.on('call-end', (data) => {
      const { conversationId, participants } = data;

      participants.forEach(participantId => {
        const participantSocketId = userSockets.get(participantId);
        if (participantSocketId && participantId !== socket.userId) {
          io.to(participantSocketId).emit('call-ended', {
            conversationId,
            endedBy: socket.userId
          });
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      userSockets.delete(socket.userId);
    });
  });

  return io;
};

module.exports = socketHandler;

