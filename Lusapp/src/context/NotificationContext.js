import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchWithAuth } from '../utils/apiClient';
import API_URL from '../config/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      setLoading(true);
      const response = await fetchWithAuth(`${API_URL}/api/notifications`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user || !token) return;
    
    try {
      const response = await fetchWithAuth(`${API_URL}/api/notifications/unread-count`);
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user, token]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const wasUnread = notifications.find(n => n.id === notificationId && !n.isRead);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token, fetchNotifications]);

  useEffect(() => {
    if (!user || !token) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, token, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
