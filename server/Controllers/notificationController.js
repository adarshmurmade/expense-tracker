import Notification from "../Models/Notification.js";
import { generateFinancialNotifications } from "../services/notificationService.js";

// Get notifications and generate fresh financial alerts
export const getNotifications = async (req, res) => {
  try {
    // Generate alerts before fetching notifications
    await generateFinancialNotifications(req.userId);

    const notifications = await Notification.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch notifications",
    });
  }
};

// Mark one notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.userId,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
};

// Delete one notification
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete notification",
    });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.userId,
    });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
    });
  } catch (error) {
    console.error("Delete all notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete notifications",
    });
  }
};