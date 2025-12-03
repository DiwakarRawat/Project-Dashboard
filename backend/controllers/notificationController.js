const Notification = require('../models/NotificationModel');

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 }) // Newest first
            .populate('sender', 'name')
            .populate('project', 'title');

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications." });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found." });
        }

        // Ensure the user owns this notification
        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized." });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json(notification);
    } catch (error) {
        console.error("Error updating notification:", error);
        res.status(500).json({ message: "Failed to update notification." });
    }
};

module.exports = {
    getNotifications,
    markNotificationRead
};
