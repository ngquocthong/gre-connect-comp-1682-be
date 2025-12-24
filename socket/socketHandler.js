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

    // Auto-join user to their personal room for direct notifications (incoming calls, etc.)
    socket.join(`user:${socket.userId}`);
    console.log(`User ${socket.userId} joined personal room user:${socket.userId}`);

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

    // Join a call room (for receiving call-specific events)
    socket.on('join-call', (callId) => {
      socket.join(`call:${callId}`);
      console.log(`User ${socket.userId} joined call room call:${callId}`);
    });

    socket.on('leave-call', (callId) => {
      socket.leave(`call:${callId}`);
      console.log(`User ${socket.userId} left call room call:${callId}`);
    });

    // Legacy socket-based call initiate (kept for backward compatibility)
    socket.on('call-initiate', (data) => {
      const { conversationId, type, participants, callId } = data;

      participants.forEach(participantId => {
        if (participantId !== socket.userId) {
          // Emit to user's personal room
          io.to(`user:${participantId}`).emit('incoming-call', {
            conversationId,
            type,
            caller: {
              _id: socket.userId,
              firstName: socket.user.firstName,
              lastName: socket.user.lastName,
              profilePicture: socket.user.profilePicture
            },
            callId: callId
          });
        }
      });
    });

    socket.on('call-accept', (data) => {
      const { conversationId, callerId, callId } = data;

      // Notify caller via their personal room
      io.to(`user:${callerId}`).emit('call-accepted', {
        conversationId,
        callId,
        acceptedBy: {
          _id: socket.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          profilePicture: socket.user.profilePicture
        }
      });

      // Also emit to call room
      if (callId) {
        io.to(`call:${callId}`).emit('user-joined-call', {
          callId,
          user: {
            _id: socket.userId,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            profilePicture: socket.user.profilePicture
          }
        });
      }
    });

    socket.on('call-reject', (data) => {
      const { conversationId, callerId, callId } = data;

      // Notify caller via their personal room
      io.to(`user:${callerId}`).emit('call-rejected', {
        conversationId,
        callId,
        rejectedBy: {
          _id: socket.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });

      // Also emit to call room
      if (callId) {
        io.to(`call:${callId}`).emit('call-declined', {
          callId,
          declinedBy: socket.userId
        });
      }
    });

    socket.on('call-end', (data) => {
      const { conversationId, callId, participants } = data;

      // Emit to call room
      if (callId) {
        io.to(`call:${callId}`).emit('call-ended', {
          callId,
          conversationId,
          endedBy: socket.userId
        });
      }

      // Also notify each participant directly
      if (participants) {
        participants.forEach(participantId => {
          if (participantId !== socket.userId) {
            io.to(`user:${participantId}`).emit('call-ended', {
              callId,
              conversationId,
              endedBy: socket.userId
            });
          }
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
      userSockets.delete(socket.userId);
    });
  });

  return io;
};

module.exports = socketHandler;

