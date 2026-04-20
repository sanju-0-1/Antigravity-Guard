const express = require('express');
const User = require('../models/User');
const Scan = require('../models/Scan');
const { protect, authorize } = require('../utils/authMiddleware');
const router = express.Router();

// All routes here are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Don't allow deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    // Also delete their scans
    await Scan.deleteMany({ userId: req.params.id });
    
    res.json({ success: true, message: 'User and their data deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// @desc    Get all scans
// @route   GET /api/admin/scans
router.get('/scans', async (req, res) => {
  try {
    const scans = await Scan.find().populate('userId', 'username email').sort({ createdAt: -1 });
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

module.exports = router;
