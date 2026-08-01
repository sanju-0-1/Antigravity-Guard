const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ error: 'Not authorized, no valid token' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      // Get user from the token if DB is connected
      if (mongoose.connection.readyState === 1) {
        try {
          req.user = await User.findById(decoded.id).select('-password');
        } catch (dbErr) {
          console.error('DB query error in protect:', dbErr.message);
        }
      }

      if (!req.user) {
        req.user = { 
          _id: decoded.id || 'fallback_user_id', 
          username: decoded.username || 'User', 
          role: decoded.role || 'user' 
        };
      }

      return next();
    } catch (error) {
      console.error('Auth token verification error:', error.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
