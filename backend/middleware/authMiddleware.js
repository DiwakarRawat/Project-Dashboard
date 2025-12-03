const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for the token in the headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header 
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Attach user to the request (excluding the password)
      req.user = await User.findById(decoded.id).select('-password');

      // Move to the next middleware or controller function
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token is found
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to restrict access based on user role
const restrictTo = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next(); // User has the required role, proceed
        } else {
            res.status(403).json({ message: `Forbidden: Access restricted to ${role}s only` });
        }
    };
};

module.exports = { protect, restrictTo };