const Resource = require('../models/Resource');

class ResourceService {
  async getResources(filters = {}) {
    const { type, search, tags } = filters;
    let query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    const resources = await Resource.find(query)
      .populate('uploadedBy', 'firstName lastName profilePicture username role')
      .sort({ createdAt: -1 });

    return resources;
  }

  async getResourceById(resourceId) {
    const resource = await Resource.findById(resourceId)
      .populate('uploadedBy', 'firstName lastName profilePicture username role');

    if (!resource) {
      throw new Error('Resource not found');
    }

    resource.views += 1;
    await resource.save();

    return resource;
  }

  async createResource(userId, data) {
    const { title, description, type, url, thumbnail, tags } = data;

    const resource = await Resource.create({
      uploadedBy: userId,
      title,
      description,
      type,
      url,
      thumbnail,
      tags: tags || []
    });

    await resource.populate('uploadedBy', 'firstName lastName profilePicture username role');
    return resource;
  }

  async updateResource(resourceId, userId, userRole, updates) {
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      throw new Error('Resource not found');
    }

    if (resource.uploadedBy.toString() !== userId.toString() && 
        !['teacher', 'staff'].includes(userRole)) {
      throw new Error('Access denied');
    }

    const { title, description, url, thumbnail, tags } = updates;

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (url) resource.url = url;
    if (thumbnail) resource.thumbnail = thumbnail;
    if (tags) resource.tags = tags;

    await resource.save();
    await resource.populate('uploadedBy', 'firstName lastName profilePicture username role');

    return resource;
  }

  async deleteResource(resourceId, userId, userRole) {
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      throw new Error('Resource not found');
    }

    if (resource.uploadedBy.toString() !== userId.toString() && 
        !['teacher', 'staff'].includes(userRole)) {
      throw new Error('Access denied');
    }

    await resource.deleteOne();
  }

  async incrementDownload(resourceId) {
    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { $inc: { downloads: 1 } },
      { new: true }
    ).populate('uploadedBy', 'firstName lastName profilePicture username role');

    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource;
  }
}

module.exports = new ResourceService();

