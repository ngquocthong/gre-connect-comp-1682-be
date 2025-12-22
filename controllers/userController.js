const userService = require('../services/userService');

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const users = await userService.getUsers({ role, search });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, username, role, bio, profilePicture, isActive } = req.body;
    const currentUserId = req.user._id.toString();

    const user = await userService.updateUser(
      req.params.id,
      { firstName, lastName, email, username, role, bio, profilePicture, isActive },
      currentUserId
    );
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Email already in use' || error.message === 'Username already in use') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id, req.user._id.toString());
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Cannot delete your own account') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await userService.getPendingUsers();
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveUser = async (req, res) => {
  try {
    const user = await userService.approveUser(req.params.id);
    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const rejectUser = async (req, res) => {
  try {
    await userService.rejectUser(req.params.id);
    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await userService.updateFcmToken(req.user._id, fcmToken);
    res.json({ message: 'FCM token updated successfully', user });
  } catch (error) {
    if (error.message === 'FCM token is required') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const removeFcmToken = async (req, res) => {
  try {
    const user = await userService.removeFcmToken(req.user._id);
    res.json({ message: 'FCM token removed successfully', user });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateFcmToken,
  removeFcmToken
};

