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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const ChatScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const { colors } = useTheme();
  const { user: currentUser, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);
  const isActiveRef = useRef(true);
  const latestUserIdRef = useRef(userId);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: userName });
    latestUserIdRef.current = userId;
  }, [userName, userId]);

  // Focus-aware async polling loop
  useFocusEffect(
    React.useCallback(() => {
      isActiveRef.current = true;
      latestUserIdRef.current = userId;
      
      const poll = async () => {
        if (!isActiveRef.current) return;
        
        // Capture current userId for this fetch
        const fetchUserId = latestUserIdRef.current;
        
        // Cancel previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();
        
        try {
          const response = await fetch(`${API_URL}/api/messages/conversations/${fetchUserId}/messages`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            signal: abortControllerRef.current.signal,
          });

          // Only update state if still active and conversation hasn't changed
          if (response.ok && isActiveRef.current && latestUserIdRef.current === fetchUserId) {
            const data = await response.json();
            setMessages(data.messages || []);
          }
        } catch (error) {
          // Ignore abort errors
          if (error.name !== 'AbortError') {
            console.error('Error fetching messages:', error);
          }
        } finally {
          // Always clear loading and schedule next poll if still active
          if (isActiveRef.current && latestUserIdRef.current === fetchUserId) {
            setLoading(false);
            setTimeout(poll, 3000);
          }
        }
      };
      
      // Start polling
      poll();
      
      // Cleanup when screen loses focus or unmounts
      return () => {
        isActiveRef.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
      };
    }, [userId, token])
  );

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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === currentUser.id;
    
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[
          styles.messageBubble,
          { backgroundColor: isMe ? colors.primary : colors.card }
        ]}>
          <Text style={[styles.messageText, { color: isMe ? '#FFFFFF' : colors.text }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Send a message to start the conversation
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
            placeholder="Type a message..."
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
            <Text style={styles.sendButtonText}>
              {sending ? '...' : '➤'}
            </Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
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
  messageContainer: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
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
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
});
