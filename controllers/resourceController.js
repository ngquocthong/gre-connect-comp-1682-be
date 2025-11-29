const resourceService = require('../services/resourceService');

const getResources = async (req, res) => {
  try {
    const { type, search, tags } = req.query;
    const resources = await resourceService.getResources({ type, search, tags });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResource = async (req, res) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    res.json(resource);
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const createResource = async (req, res) => {
  try {
    const { title, description, type, url, thumbnail, tags } = req.body;
    const resource = await resourceService.createResource(req.user._id, {
      title,
      description,
      type,
      url,
      thumbnail,
      tags
    });
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const { title, description, url, thumbnail, tags } = req.body;
    const resource = await resourceService.updateResource(
      req.params.id,
      req.user._id,
      req.user.role,
      { title, description, url, thumbnail, tags }
    );
    res.json(resource);
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    await resourceService.deleteResource(req.params.id, req.user._id, req.user.role);
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const incrementDownload = async (req, res) => {
  try {
    const resource = await resourceService.incrementDownload(req.params.id);
    res.json(resource);
  } catch (error) {
    if (error.message === 'Resource not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload
};
