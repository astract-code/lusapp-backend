import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { UserAvatar } from './UserAvatar';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/apiClient';
import API_URL from '../config/api';

export const PostCard = ({ post, onUserPress, onRacePress }) => {
  const { colors } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const { user: currentUser } = useAuth();
  const { getUserById, getRaceById, toggleLikePost, addComment } = useAppStore();
  
  // Use data from post object (API) or fallback to store lookup
  const postAuthor = post.userName ? {
    id: post.userId,
    name: post.userName,
    avatar: post.userAvatar
  } : getUserById(post.userId);
  
  const race = post.raceName ? {
    id: post.raceId,
    name: post.raceName,
    city: post.city,
    country: post.country,
    date: post.date,
    sportCategory: post.sportCategory,
    sportSubtype: post.sportSubtype
  } : getRaceById(post.raceId);
  
  // For new_race and upcoming_race types, we don't need an author
  if (post.type !== 'new_race' && post.type !== 'upcoming_race' && !postAuthor) return null;
  if (!currentUser) return null;

  const handleLike = async () => {
    const isCurrentlyLiked = post.likedBy?.includes(currentUser.id?.toString()) || 
                              post.likedBy?.includes(currentUser.id);
    
    // Optimistic update
    toggleLikePost(post.id, currentUser.id);
    
    try {
      // Only call API for real posts (not upcoming_race or new_race which have string IDs like "upcoming_123")
      const postIdStr = post.id?.toString() || '';
      if (postIdStr.startsWith('upcoming_') || postIdStr.startsWith('race_')) {
        return; // These are virtual feed items, not real posts
      }
      
      if (isCurrentlyLiked) {
        await fetchWithAuth(`${API_URL}/api/posts/${post.id}/unlike`, { method: 'DELETE' });
      } else {
        await fetchWithAuth(`${API_URL}/api/posts/${post.id}/like`, { method: 'POST' });
      }
    } catch (error) {
      // Revert on error
      toggleLikePost(post.id, currentUser.id);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    const text = commentText.trim();
    setCommentText('');
    
    // Only call API for real posts
    const postIdStr = post.id?.toString() || '';
    if (postIdStr.startsWith('upcoming_') || postIdStr.startsWith('race_')) {
      return; // These are virtual feed items, not real posts
    }
    
    try {
      const response = await fetchWithAuth(`${API_URL}/api/posts/${post.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update local state with the new comment
        addComment(post.id, currentUser.id, text);
      }
    } catch (error) {
      // Could show error to user
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

  const isLikedByCurrentUser = post.likedBy?.includes(currentUser.id) || false;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        {(post.type === 'new_race' || post.type === 'upcoming_race') ? (
          <View style={[styles.lusappIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.lusappIconText}>L</Text>
          </View>
        ) : (
          <UserAvatar uri={postAuthor?.avatar} size={48} onPress={() => postAuthor?.id && onUserPress(postAuthor.id)} />
        )}
        <View style={styles.headerText}>
          {post.type === 'new_race' ? (
            <Text style={[styles.userName, { color: colors.text }]}>New Race Added</Text>
          ) : post.type === 'upcoming_race' ? (
            <Text style={[styles.userName, { color: colors.text }]}>Upcoming Race</Text>
          ) : (
            <TouchableOpacity onPress={() => postAuthor?.id && onUserPress(postAuthor.id)}>
              <Text style={[styles.userName, { color: colors.text }]}>{postAuthor?.name}</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTime(post.timestamp)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {(post.type === 'new_race' || post.type === 'upcoming_race') ? (
          <View>
            <Text style={[styles.activityText, { color: colors.text }]}>
              🏁 {post.type === 'upcoming_race' ? 'Check out this race:' : 'New race available:'}{' '}
              <Text style={[styles.raceLink, { color: colors.primary }]} onPress={() => race && onRacePress(race.id)}>
                {race?.name || post.raceName || 'a race'}
              </Text>
            </Text>
            {race && (
              <Text style={[styles.raceDetails, { color: colors.textSecondary }]}>
                📍 {race.city}, {race.country} • 📅 {new Date(race.date).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : post.type === 'signup' ? (
          <Text style={[styles.activityText, { color: colors.text }]}>
            🎯 Signed up for{' '}
            <Text style={[styles.raceLink, { color: colors.primary }]} onPress={() => race && onRacePress(race.id)}>
              {race?.name || 'a race'}
            </Text>
          </Text>
        ) : post.type === 'race_created' ? (
          <Text style={[styles.activityText, { color: colors.text }]}>
            🆕 Added a new race:{' '}
            <Text style={[styles.raceLink, { color: colors.primary }]} onPress={() => race && onRacePress(race.id)}>
              {race?.name || post.raceName || 'a race'}
            </Text>
            {race && (
              <Text style={[styles.raceDetails, { color: colors.textSecondary }]}>
                {'\n'}📍 {race.city}, {race.country} • 📅 {new Date(race.date).toLocaleDateString()}
              </Text>
            )}
          </Text>
        ) : (
          <View>
            <Text style={[styles.activityText, { color: colors.text }]}>
              🏆 Completed{' '}
              <Text style={[styles.raceLink, { color: colors.primary }]}>
                {post.raceName || race?.name || 'a race'}
              </Text>
            </Text>
            {post.time && (
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                ⏱️ Time: {post.time}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Text style={styles.actionIcon}>{isLikedByCurrentUser ? '❤️' : '🤍'}</Text>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.likedBy?.length || 0} {post.likedBy?.length === 1 ? 'like' : 'likes'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}
          </Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
          {post.comments?.map((comment, index) => {
            const commentUser = getUserById(comment.userId);
            return (
              <View key={index} style={styles.comment}>
                <UserAvatar uri={commentUser?.avatar} size={32} />
                <View style={styles.commentContent}>
                  <Text style={[styles.commentUser, { color: colors.text }]}>
                    {commentUser?.name}
                  </Text>
                  <Text style={[styles.commentText, { color: colors.text }]}>
                    {comment.text}
                  </Text>
                </View>
              </View>
            );
          })}
          
          <View style={styles.commentInput}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
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
  lusappIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lusappIconText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
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
  raceDetails: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
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
