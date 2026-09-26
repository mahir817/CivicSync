package com.civicsync.backend.service;

import com.civicsync.backend.entity.Notification;
import com.civicsync.backend.entity.User;
import com.civicsync.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    public void send(User user, String key, String messageKey, Long campaignId, String message) {
        if (notifications.existsByUserIdAndDedupeKey(user.getId(), key)) return;
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setDedupeKey(key);
        notification.setMessageKey(messageKey);
        notification.setCampaignId(campaignId);
        notification.setMessage(message);
        notifications.save(notification);
    }
}
