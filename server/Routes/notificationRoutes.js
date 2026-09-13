import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../Controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

router.put("/:id/read", authMiddleware, markNotificationAsRead);

router.put("/read-all", authMiddleware, markAllNotificationsAsRead);

router.delete("/:id", authMiddleware, deleteNotification);

router.delete("/", authMiddleware, deleteAllNotifications);

export default router;