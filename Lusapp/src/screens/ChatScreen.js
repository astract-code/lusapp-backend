import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from '../components/UserAvatar';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const ChatScreen = ({ route, navigation }) => {
  const { userId, userName, userAvatar } = route.params;
  const { colors } = useTheme();
  const { user: currentUser, token } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserLastActive, setOtherUserLastActive] = useState(null);
  const [otherUserAvatar, setOtherUserAvatar] = useState(userAvatar || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const flatListRef = useRef(null);
  const isActiveRef = useRef(true);
  const latestUserIdRef = useRef(userId);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ 
      title: userName,
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => setShowSearch(!showSearch)}
          style={{ marginRight: 10 }}
        >
          <Ionicons name="search-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
    latestUserIdRef.current = userId;
  }, [userName, userId, showSearch, colors.primary]);

  useFocusEffect(
    React.useCallback(() => {
      isActiveRef.current = true;
      latestUserIdRef.current = userId;
      
      const poll = async () => {
        if (!isActiveRef.current) return;
        
        const fetchUserId = latestUserIdRef.current;
        
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        try {
          const response = await fetch(`${API_URL}/api/messages/conversations/${fetchUserId}/messages`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortControllerRef.current.signal,
          });

          if (response.ok && isActiveRef.current && latestUserIdRef.current === fetchUserId) {
            const data = await response.json();
            setMessages(data.messages || []);
            
            if (data.otherUserLastActive) {
              const lastActive = new Date(data.otherUserLastActive);
              const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
              setOtherUserOnline(lastActive > fiveMinutesAgo);
              setOtherUserLastActive(lastActive);
            }
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching messages:', error);
          }
        } finally {
          if (isActiveRef.current && latestUserIdRef.current === fetchUserId) {
            setLoading(false);
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
    }, [userId, token])
  );

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/messages/conversations/${userId}/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.messages || []);
      }
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await fetch(`${API_URL}/api/messages/conversations/${userId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageText }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, {
          ...newMessage,
          sender_name: currentUser.name,
          sender_avatar: currentUser.avatar
        }]);
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
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
          text: t('deleteButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/messages/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (response.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
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

  const formatLastActive = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return t('justNow');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('minutesAgo')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('hoursAgo')}`;
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item, index }) => {
    const isMe = String(item.sender_id) === String(currentUser.id);
    const isLastMessage = index === messages.length - 1;
    const showReadReceipt = isMe && isLastMessage && item.read;
    const avatarUri = isMe ? currentUser?.avatar : (item.sender_avatar || otherUserAvatar);
    
    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            <UserAvatar uri={avatarUri} size={32} />
          </View>
        )}
        <TouchableOpacity 
          style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}
          onLongPress={() => isMe && deleteMessage(item.id)}
          delayLongPress={500}
        >
          <View style={[
            styles.messageBubble,
            { backgroundColor: isMe ? colors.primary : colors.card }
          ]}>
            <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : colors.text }]}>
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
                {formatTime(item.created_at)}
              </Text>
              {showReadReceipt && (
                <View style={styles.readReceipt}>
                  <Ionicons name="checkmark-done-outline" size={14} color="rgba(255,255,255,0.7)" />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {isMe && (
          <View style={styles.avatarContainer}>
            <UserAvatar uri={currentUser?.avatar} size={32} />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.statusBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.statusContent}>
          <View style={[styles.onlineIndicator, { backgroundColor: otherUserOnline ? '#4ADE80' : colors.textSecondary }]} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {otherUserOnline ? t('online') : `${t('lastSeen')} ${formatLastActive(otherUserLastActive)}`}
          </Text>
        </View>
      </View>

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
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <Text style={[styles.searchResultsCount, { color: colors.textSecondary }]}>
                {searchResults.length} {t('resultsFound')}
              </Text>
            </View>
          )}
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('noMessagesYet')}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {t('sendMessageToStart')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('typeMessage')}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !sending ? colors.primary : colors.border }
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
  },
  searchContainer: {
    padding: SPACING.md,
  },
  searchInput: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  searchResults: {
    marginTop: SPACING.sm,
  },
  searchResultsCount: {
    fontSize: FONT_SIZE.sm,
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
  avatarContainer: {
    marginHorizontal: SPACING.xs,
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
  messageBubble: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: FONT_SIZE.xs,
  },
  readReceipt: {
    marginLeft: SPACING.xs,
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
});
