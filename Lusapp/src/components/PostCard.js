import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, TextInput } from 'react-native';
import { UserAvatar } from './UserAvatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import { useAppStore } from '../context/AppContext';

export const PostCard = ({ post, onUserPress, onRacePress }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const { getUserById, getRaceById, toggleLikePost, addComment } = useAppStore();
  
  const user = getUserById(post.userId);
  const race = getRaceById(post.raceId);
  
  if (!user) return null;

  const handleLike = () => {
    toggleLikePost(post.id, user.id);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment(post.id, user.id, commentText);
      setCommentText('');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <UserAvatar uri={user.avatar} size={48} onPress={() => onUserPress(user.id)} />
        <View style={styles.headerText}>
          <TouchableOpacity onPress={() => onUserPress(user.id)}>
            <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
          </TouchableOpacity>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTime(post.timestamp)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {post.type === 'signup' ? (
          <Text style={[styles.activityText, { color: theme.text }]}>
            🎯 Signed up for{' '}
            <Text style={[styles.raceLink, { color: theme.primary }]} onPress={() => race && onRacePress(race.id)}>
              {race?.name || 'a race'}
            </Text>
          </Text>
        ) : (
          <View>
            <Text style={[styles.activityText, { color: theme.text }]}>
              🏆 Completed{' '}
              <Text style={[styles.raceLink, { color: theme.primary }]}>
                {post.raceName || race?.name || 'a race'}
              </Text>
            </Text>
            {post.time && (
              <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                ⏱️ Time: {post.time}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Text style={styles.actionIcon}>{post.liked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.actionText, { color: theme.textSecondary }]}>
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionText, { color: theme.textSecondary }]}>
            {post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={[styles.commentsSection, { borderTopColor: theme.border }]}>
          {post.comments?.map((comment, index) => {
            const commentUser = getUserById(comment.userId);
            return (
              <View key={index} style={styles.comment}>
                <UserAvatar uri={commentUser?.avatar} size={32} />
                <View style={styles.commentContent}>
                  <Text style={[styles.commentUser, { color: theme.text }]}>
                    {commentUser?.name}
                  </Text>
                  <Text style={[styles.commentText, { color: theme.text }]}>
                    {comment.text}
                  </Text>
                </View>
              </View>
            );
          })}
          
          <View style={styles.commentInput}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background, 
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Add a comment..."
              placeholderTextColor={theme.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: theme.primary }]}
              onPress={handleAddComment}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  headerText: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  activityText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  raceLink: {
    fontWeight: '600',
  },
  timeText: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionIcon: {
    fontSize: FONT_SIZE.lg,
    marginRight: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
  },
  commentsSection: {
    borderTopWidth: 1,
    padding: SPACING.md,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  commentContent: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  commentUser: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  commentText: {
    fontSize: FONT_SIZE.sm,
  },
  commentInput: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
  },
  sendButton: {
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
