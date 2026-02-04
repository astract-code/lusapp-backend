import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const MessagesScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [showArchived]);

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [showArchived])
  );

  const fetchConversations = async () => {
    try {
      const url = showArchived 
        ? `${API_URL}/api/messages/conversations?includeArchived=true`
        : `${API_URL}/api/messages/conversations`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleMute = async (conversationId, currentMuted) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversations/${conversationId}/mute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ muted: !currentMuted }),
      });

      if (response.ok) {
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, muted: !currentMuted } : c
        ));
      }
    } catch (error) {
      console.error('Error muting conversation:', error);
    }
  };

  const handleArchive = async (conversationId, currentArchived) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: !currentArchived }),
      });

      if (response.ok) {
        if (!showArchived && !currentArchived) {
          setConversations(prev => prev.filter(c => c.id !== conversationId));
        } else {
          setConversations(prev => prev.map(c => 
            c.id === conversationId ? { ...c, archived: !currentArchived } : c
          ));
        }
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const showConversationOptions = (item) => {
    Alert.alert(
      item.other_user_name,
      t('chooseAction'),
      [
        {
          text: item.muted ? t('unmute') : t('mute'),
          onPress: () => handleMute(item.id, item.muted),
        },
        {
          text: item.archived ? t('unarchive') : t('archive'),
          onPress: () => handleArchive(item.id, item.archived),
        },
        { text: t('cancel'), style: 'cancel' },
      ]
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    if (diff < 604800000) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOnline = (lastActive) => {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActive) > fiveMinutesAgo;
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem, 
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        item.archived && styles.archivedItem,
      ]}
      onPress={() => navigation.navigate('Chat', { 
        userId: item.other_user_id, 
        userName: item.other_user_name,
        userAvatar: item.other_user_avatar
      })}
      onLongPress={() => showConversationOptions(item)}
      delayLongPress={500}
    >
      <View style={styles.avatarContainer}>
        {item.other_user_avatar ? (
          <Image source={{ uri: item.other_user_avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.border }]}>
            <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
        <View style={[
          styles.onlineIndicator, 
          { backgroundColor: isOnline(item.other_user_last_active) ? '#4ADE80' : 'transparent' }
        ]} />
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <View style={styles.nameContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>{item.other_user_name}</Text>
            {item.muted && (
              <Ionicons name="notifications-off-outline" size={14} color={colors.textSecondary} style={styles.mutedIcon} />
            )}
          </View>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {formatTime(item.last_message_at)}
          </Text>
        </View>
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.lastMessage,
              { color: item.unread_count > 0 ? colors.text : colors.textSecondary }
            ]}
            numberOfLines={1}
          >
            {item.last_message || t('noMessagesYet')}
          </Text>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('messages')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('messages')}</Text>
        <TouchableOpacity 
          onPress={() => setShowArchived(!showArchived)}
          style={styles.archiveToggle}
        >
          <Ionicons 
            name={showArchived ? "archive" : "archive-outline"} 
            size={22} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {showArchived && (
        <View style={[styles.archiveNotice, { backgroundColor: colors.card }]}>
          <Ionicons name="archive-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.archiveNoticeText, { color: colors.textSecondary }]}>
            {t('showingArchived')}
          </Text>
        </View>
      )}
      
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {showArchived ? t('noArchivedMessages') : t('noMessagesYet')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {showArchived 
              ? t('archivedHint')
              : t('startConversation')
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t('longPressHint')}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
  },
  archiveToggle: {
    padding: SPACING.sm,
  },
  archiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  archiveNoticeText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  archivedItem: {
    opacity: 0.7,
  },
  avatarContainer: {
    marginRight: SPACING.md,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  mutedIcon: {
    marginLeft: SPACING.xs,
  },
  time: {
    fontSize: FONT_SIZE.sm,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: FONT_SIZE.md,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
  },
  hint: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    paddingVertical: SPACING.sm,
  },
});
