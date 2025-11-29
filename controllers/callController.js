const callService = require('../services/callService');

const initiateCall = async (req, res) => {
  try {
    const { conversationId, type } = req.body;
    const result = await callService.initiateCall(req.user._id, { conversationId, type });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await callService.joinCall(id, req.user._id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Call not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Call has ended') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const endCall = async (req, res) => {
  try {
    const call = await callService.endCall(req.params.id, req.user._id);
    res.json(call);
  } catch (error) {
    if (error.message === 'Call not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Only initiator can end call') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const calls = await callService.getCallHistory(conversationId);
    res.json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiateCall,
  joinCall,
  endCall,
  getCallHistory
};
