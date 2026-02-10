import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

import API_URL from '../config/api';

export const GroupChatTab = ({ groupId }) => {
  const { colors } = useTheme();
  const { user: currentUser, token } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [announcementMode, setAnnouncementMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const flatListRef = useRef(null);
  const isActiveRef = useRef(true);
  const latestGroupIdRef = useRef(groupId);
  const abortControllerRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      isActiveRef.current = true;
      latestGroupIdRef.current = groupId;

      const poll = async () => {
        if (!isActiveRef.current) return;

        const fetchGroupId = latestGroupIdRef.current;

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
          const response = await fetch(`${API_URL}/api/groups/${fetchGroupId}/messages`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortControllerRef.current.signal,
          });

          if (response.ok && isActiveRef.current && latestGroupIdRef.current === fetchGroupId) {
            const data = await response.json();
            setMessages(data.messages || []);
            setAnnouncementMode(data.announcementMode || false);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching group messages:', error);
          }
        } finally {
          if (isActiveRef.current && latestGroupIdRef.current === fetchGroupId) {
            setTimeout(poll, 3000);
          }
        }
      };

      poll();

      return () => {
        isActiveRef.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };
    }, [groupId, token])
  );

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.messages || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setShowSearch(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending || !currentUser) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });

      if (response.ok) {
        const data = await response.json();
        const messageData = data.message || data;
        
        setMessages(prev => [...prev, {
          ...messageData,
          sender_name: messageData.sender_name || currentUser?.name || t('unknown'),
          sender_avatar: messageData.sender_avatar || currentUser?.avatar || null
        }]);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          Alert.alert(t('cannotSendMessage'), errorData.error);
        }
        setInputText(messageText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    Alert.alert(
      t('deleteMessage'),
      t('deleteMessageConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/groups/${groupId}/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (response.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
              } else {
                const error = await response.json();
                Alert.alert(t('oops'), error.error || t('failedToDeleteMessage'));
              }
            } catch (error) {
              console.error('Error deleting message:', error);
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const pinnedMessages = messages.filter(m => m.pinned);
  const regularMessages = messages.filter(m => !m.pinned);

  const renderPinnedMessage = ({ item }) => (
    <View style={[styles.pinnedMessageContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={styles.pinnedHeader}>
        <Ionicons name="pin" size={14} color={colors.primary} />
        <Text style={[styles.pinnedLabel, { color: colors.primary }]}>{t('pinned')}</Text>
        {item.pinned_by_name && (
          <Text style={[styles.pinnedBy, { color: colors.textSecondary }]}>
            {t('by')} {item.pinned_by_name}
          </Text>
        )}
      </View>
      <Text style={[styles.pinnedContent, { color: colors.text }]}>{item.content}</Text>
      <Text style={[styles.pinnedMeta, { color: colors.textSecondary }]}>
        {item.sender_name} • {formatTime(item.created_at)}
      </Text>
    </View>
  );

  const renderMessage = ({ item }) => {
    if (!currentUser) {
      return null;
    }
    const isMe = String(item.sender_id) === String(currentUser.id);

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            {item.sender_avatar ? (
              <Image source={{ uri: item.sender_avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.border }]}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              </View>
            )}
          </View>
        )}
        <TouchableOpacity 
          style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}
          onLongPress={() => isMe && deleteMessage(item.id)}
          delayLongPress={500}
        >
          <View style={styles.messageContent}>
            {!isMe && (
              <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                {item.sender_name}
              </Text>
            )}
            <View
              style={[
                styles.messageBubble,
                { backgroundColor: isMe ? colors.primary : colors.card }
              ]}
            >
              <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : colors.text }]}>
                {item.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                ]}
              >
                {formatTime(item.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {isMe && (
          <View style={styles.avatarContainer}>
            {currentUser.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.border }]}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text }]}
            placeholder={t('searchMessages')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={clearSearch} style={styles.searchClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {showSearchResults && searchResults.length > 0 && (
        <View style={[styles.searchResultsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.searchResultsHeader}>
            <Text style={[styles.searchResultsTitle, { color: colors.text }]}>
              {searchResults.length} {t('resultsFound')} "{searchQuery}"
            </Text>
            <TouchableOpacity onPress={() => setShowSearchResults(false)}>
              <Ionicons name="chevron-up" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `search-${item.id}`}
            style={styles.searchResultsList}
            renderItem={({ item }) => (
              <View style={[styles.searchResultItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.searchResultSender, { color: colors.primary }]}>
                  {item.sender_name}
                </Text>
                <Text style={[styles.searchResultContent, { color: colors.text }]} numberOfLines={2}>
                  {item.content}
                </Text>
                <Text style={[styles.searchResultTime, { color: colors.textSecondary }]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {showSearchResults && searchResults.length === 0 && (
        <View style={[styles.noResultsContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
            {t('noMessagesFoundFor')} "{searchQuery}"
          </Text>
          <TouchableOpacity onPress={() => setShowSearchResults(false)}>
            <Text style={[styles.noResultsDismiss, { color: colors.primary }]}>{t('dismiss')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {announcementMode && (
        <View style={[styles.announcementBanner, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="megaphone-outline" size={16} color={colors.primary} />
          <Text style={[styles.announcementText, { color: colors.primary }]}>
            {t('announcementModeOn')}
          </Text>
        </View>
      )}

      {pinnedMessages.length > 0 && (
        <View style={styles.pinnedSection}>
          <FlatList
            horizontal
            data={pinnedMessages}
            renderItem={renderPinnedMessage}
            keyExtractor={(item) => `pinned-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedList}
          />
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noMessagesYet')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t('beFirstToSendMessage')}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={regularMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <TouchableOpacity 
              onPress={() => setShowSearch(true)}
              style={[styles.searchButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.searchButtonText, { color: colors.textSecondary }]}>
                {t('searchMessages')}
              </Text>
            </TouchableOpacity>
          }
        />
      )}

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.card, borderTopColor: colors.border }
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text }
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={announcementMode ? t('onlyAdminsCanPost') : t('typeMessage')}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          editable={!announcementMode || currentUser?.is_admin}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor:
                inputText.trim() && !sending ? colors.primary : colors.border
            }
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t('longPressToDelete')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  searchClose: {
    padding: SPACING.sm,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  searchButtonText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
  },
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  announcementText: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  pinnedSection: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pinnedList: {
    padding: SPACING.sm,
  },
  pinnedMessageContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    marginRight: SPACING.sm,
    minWidth: 200,
    maxWidth: 280,
  },
  pinnedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pinnedLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  pinnedBy: {
    fontSize: FONT_SIZE.xs,
    marginLeft: SPACING.xs,
  },
  pinnedContent: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  pinnedMeta: {
    fontSize: FONT_SIZE.xs,
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
  messagesList: {
    padding: SPACING.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  messageContainer: {
    maxWidth: '70%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginHorizontal: SPACING.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  messageBubble: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xs,
  },
  messageTime: {
    fontSize: FONT_SIZE.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    marginRight: SPACING.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    paddingVertical: SPACING.xs,
  },
  searchResultsContainer: {
    maxHeight: 200,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  searchResultsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  searchResultsList: {
    paddingHorizontal: SPACING.sm,
  },
  searchResultItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  searchResultSender: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultContent: {
    fontSize: FONT_SIZE.sm,
  },
  searchResultTime: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  noResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  noResultsText: {
    fontSize: FONT_SIZE.sm,
  },
  noResultsDismiss: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
