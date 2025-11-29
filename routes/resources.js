const express = require('express');
const { 
  getResources, 
  getResource, 
  createResource, 
  updateResource, 
  deleteResource,
  incrementDownload
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getResources);

router.get('/:id', protect, getResource);

router.post('/', protect, createResource);

router.put('/:id', protect, updateResource);

router.delete('/:id', protect, deleteResource);

router.post('/:id/download', protect, incrementDownload);

module.exports = router;

