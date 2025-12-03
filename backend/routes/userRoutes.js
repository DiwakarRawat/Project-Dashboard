
const express = require('express');
const { registerUser, authUser, updateUserProfile } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/users/register - Handles StudentRegistration.js and TeacherRegistration.js
router.post('/register', registerUser);

// POST /api/users/login - Handles Login.js
router.post('/login', authUser);

// PUT /api/users/profile (Protected route to update Name/Phone)
router.route('/profile')
    .put(protect, updateUserProfile); // Protect ensures only logged-in users can update their profile

// Notification Routes
const { getNotifications, markNotificationRead } = require('../controllers/notificationController');

router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;
