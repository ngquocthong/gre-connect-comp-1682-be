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

    console.log(`📅 Creating event: ${title} by user ${req.user._id} (${req.user.role})`);

    // Validate date is not in the past (optional business rule)
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      return res.status(400).json({ 
        message: 'Cannot create events in the past',
        field: 'date'
      });
    }

    // Validate time format and logic
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      return res.status(400).json({ 
        message: 'End time must be after start time',
        field: 'endTime'
      });
    }

    const event = await eventService.createEvent(req.user._id, req.user.role, {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      type: type || 'other',
      color: color || '#3b82f6',
      recurrence: recurrence || 'none'
    });

    console.log(`✅ Event created successfully: ${event._id}`);

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('❌ Create event error:', error);
    
    if (error.message === 'Only teachers and staff can create events') {
      return res.status(403).json({ message: error.message });
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        message: 'Validation error',
        errors 
      });
    }

    res.status(500).json({ 
      message: error.message || 'Failed to create event',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
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
