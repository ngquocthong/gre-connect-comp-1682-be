const Event = require('../models/Event');

class EventService {
  async getEvents(filters = {}) {
    const { startDate, endDate, type } = filters;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'firstName lastName profilePicture username role')
      .sort({ date: 1, startTime: 1 });

    return events;
  }

  async getEventById(eventId) {
    const event = await Event.findById(eventId)
      .populate('createdBy', 'firstName lastName profilePicture username role')
      .populate('participants', 'firstName lastName profilePicture username');

    if (!event) {
      throw new Error('Event not found');
    }

    return event;
  }

  async createEvent(userId, userRole, data) {
    if (!['teacher', 'staff'].includes(userRole)) {
      throw new Error('Only teachers and staff can create events');
    }

    const { title, description, date, startTime, endTime, location, type, color, recurrence } = data;

    const event = await Event.create({
      createdBy: userId,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      type,
      color,
      recurrence,
      participants: [userId]
    });

    await event.populate('createdBy', 'firstName lastName profilePicture username role');
    return event;
  }

  async updateEvent(eventId, userId, userRole, updates) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.createdBy.toString() !== userId.toString() && 
        !['staff'].includes(userRole)) {
      throw new Error('Access denied');
    }

    const { title, description, date, startTime, endTime, location, type, color, recurrence } = updates;

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (location) event.location = location;
    if (type) event.type = type;
    if (color) event.color = color;
    if (recurrence) event.recurrence = recurrence;

    await event.save();
    await event.populate('createdBy', 'firstName lastName profilePicture username role');

    return event;
  }

  async deleteEvent(eventId, userId, userRole) {
    const event = await Event.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.createdBy.toString() !== userId.toString() && 
        !['staff'].includes(userRole)) {
      throw new Error('Access denied');
    }

    await event.deleteOne();
  }
}

module.exports = new EventService();

