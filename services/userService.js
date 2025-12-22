const User = require('../models/User');

class UserService {
  async getUsers(filters = {}) {
    const { role, search } = filters;
    let query = { isPending: false };

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');
    return users;
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateUser(userId, updates, currentUserId) {
    const { firstName, lastName, email, username, role, bio, profilePicture, isActive } = updates;

    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness if changing
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        throw new Error('Email already in use');
      }
    }

    // Check username uniqueness if changing
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        throw new Error('Username already in use');
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    // Prevent staff from changing their own role
    if (role && userId !== currentUserId) {
      user.role = role;
    }

    await user.save();

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  async toggleUserStatus(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = !user.isActive;
    await user.save();
    return user;
  }

  async deleteUser(userId, currentUserId) {
    if (userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getPendingUsers() {
    const pendingUsers = await User.find({ isPending: true }).select('-password');
    return pendingUsers;
  }

  async approveUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.isPending = false;
    user.isActive = true;
    await user.save();

    return user;
  }

  async rejectUser(userId) {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateFcmToken(userId, fcmToken) {
    if (!fcmToken) {
      throw new Error('FCM token is required');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true, select: '-password' }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async removeFcmToken(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $unset: { fcmToken: 1 } },
      { new: true, select: '-password' }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

module.exports = new UserService();

