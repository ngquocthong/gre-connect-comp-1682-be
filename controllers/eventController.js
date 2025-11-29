const eventService = require('../services/eventService');

const getEvents = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const events = await eventService.getEvents({ startDate, endDate, type });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    res.json(event);
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, type, color, recurrence } = req.body;

    const event = await eventService.createEvent(req.user._id, req.user.role, {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      type,
      color,
      recurrence
    });

    res.status(201).json(event);
  } catch (error) {
    if (error.message === 'Only teachers and staff can create events') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, location, type, color, recurrence } = req.body;

    const event = await eventService.updateEvent(req.params.id, req.user._id, req.user.role, {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      type,
      color,
      recurrence
    });

    res.json(event);
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user._id, req.user.role);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
};
