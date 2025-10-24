import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const GroupChatTab = ({ groupId }) => {
  const { colors } = useTheme();
  const { user: currentUser, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
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

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

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
        {!isMe && (
          <View style={styles.avatarContainer}>
            {item.sender_avatar ? (
              <Image source={{ uri: item.sender_avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.border }]} />
            )}
          </View>
        )}
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
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No messages yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Be the first to send a message
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
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
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
          <Text style={styles.sendButtonText}>{sending ? '...' : '➤'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flexDirection: 'row',
    maxWidth: '85%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
});
