import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { UserAvatar } from '../components/UserAvatar';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'like':
      return { name: 'heart', color: '#EF4444' };
    case 'comment':
      return { name: 'chatbubble', color: '#3B82F6' };
    case 'follow':
      return { name: 'person-add', color: '#10B981' };
    default:
      return { name: 'notifications', color: '#6B7280' };
  }
};

export const NotificationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.postId) {
      navigation.navigate('Feed', {
        screen: 'FeedMain',
        params: { highlightPostId: notification.postId }
      });
    }
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { 
            backgroundColor: item.isRead ? colors.card : colors.primary + '15',
            borderColor: colors.border 
          }
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.actorAvatar ? (
            <UserAvatar uri={item.actorAvatar} size={48} />
          ) : (
            <View style={[styles.defaultAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name={icon.name} size={24} color={icon.color} />
            </View>
          )}
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={12} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTimeAgo(item.createdAt)}
          </Text>
        </View>
        
        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No notifications yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        When someone likes or comments on your posts, you'll see it here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={loading ? null : renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchNotifications}
            tintColor={colors.primary}
          />
        }
      />

      {loading && notifications.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    flex: 1,
  },
  markAllButton: {
    padding: SPACING.sm,
  },
  markAllText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  list: {
    paddingVertical: SPACING.sm,
  },
  emptyList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  timestamp: {
    fontSize: FONT_SIZE.sm,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
