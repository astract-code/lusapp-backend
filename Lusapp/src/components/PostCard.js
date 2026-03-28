import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActionSheetIOS, Alert, Platform } from 'react-native';
import { UserAvatar } from './UserAvatar';
import { SPACING, BORDER_RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchWithAuth } from '../utils/apiClient';
import API_URL from '../config/api';

export const PostCard = ({ post, onUserPress, onRacePress, onPostUpdate, onPostHide }) => {
  const { colors } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { getUserById, getRaceById, toggleLikePost, addComment } = useAppStore();
  
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
  
  if (post.type !== 'new_race' && post.type !== 'upcoming_race' && !postAuthor) return null;
  if (!currentUser) return null;

  const isOwnPost = postAuthor?.id?.toString() === currentUser.id?.toString();
  const isSystemPost = post.type === 'new_race' || post.type === 'upcoming_race';

  const handleLike = async () => {
    const isCurrentlyLiked = post.likedBy?.includes(currentUser.id?.toString()) || 
                              post.likedBy?.includes(currentUser.id);
    const userId = currentUser.id?.toString();
    const updatedLikedBy = isCurrentlyLiked
      ? (post.likedBy || []).filter(id => id !== userId && id !== currentUser.id)
      : [...(post.likedBy || []), userId];
    
    if (onPostUpdate) onPostUpdate(post.id, { likedBy: updatedLikedBy });
    toggleLikePost(post.id, currentUser.id);
    
    try {
      const postIdStr = post.id?.toString() || '';
      if (postIdStr.startsWith('upcoming_') || postIdStr.startsWith('race_')) return;
      if (isCurrentlyLiked) {
        await fetchWithAuth(`${API_URL}/api/posts/${post.id}/unlike`, { method: 'DELETE' });
      } else {
        await fetchWithAuth(`${API_URL}/api/posts/${post.id}/like`, { method: 'POST' });
      }
    } catch (error) {
      if (onPostUpdate) onPostUpdate(post.id, { likedBy: post.likedBy });
      toggleLikePost(post.id, currentUser.id);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    const postIdStr = post.id?.toString() || '';
    if (postIdStr.startsWith('upcoming_') || postIdStr.startsWith('race_')) return;
    const newComment = {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      timestamp: new Date().toISOString()
    };
    const updatedComments = [...(post.comments || []), newComment];
    if (onPostUpdate) onPostUpdate(post.id, { comments: updatedComments });
    try {
      const response = await fetchWithAuth(`${API_URL}/api/posts/${post.id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (response.ok) addComment(post.id, currentUser.id, text);
    } catch (error) {
      if (onPostUpdate) onPostUpdate(post.id, { comments: post.comments });
    }
  };

  const submitReport = async (reason) => {
    try {
      await fetchWithAuth(`${API_URL}/api/auth/reports`, {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'post',
          contentId: post.id?.toString(),
          reportedUserId: postAuthor?.id,
          reason,
        }),
      });
      Alert.alert('', t('reportSubmitted'));
    } catch {
      Alert.alert(t('oops'), t('error'));
    }
  };

  const handleReportPost = () => {
    const reasons = [
      t('reportSpam'),
      t('reportHateful'),
      t('reportInappropriate'),
      t('reportOther'),
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('reportReasonLabel'),
          options: [...reasons, t('cancel')],
          cancelButtonIndex: reasons.length,
          destructiveButtonIndex: 1,
        },
        (idx) => {
          if (idx < reasons.length) submitReport(reasons[idx]);
        }
      );
    } else {
      Alert.alert(t('reportReasonLabel'), '', [
        ...reasons.map((r) => ({ text: r, onPress: () => submitReport(r) })),
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      t('blockUserConfirmTitle'),
      t('blockUserConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('block'),
          style: 'destructive',
          onPress: async () => {
            try {
              await fetchWithAuth(`${API_URL}/api/auth/users/block/${postAuthor.id}`, { method: 'POST' });
              Alert.alert('', t('userBlocked'));
              if (onPostHide) onPostHide(post.id, postAuthor.id);
            } catch {
              Alert.alert(t('oops'), t('error'));
            }
          },
        },
      ]
    );
  };

  const handleMoreOptions = () => {
    const options = [];
    const actions = [];

    options.push(t('reportPost'));
    actions.push(handleReportPost);

    if (!isOwnPost) {
      options.push(t('blockUser'));
      actions.push(handleBlockUser);
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, t('cancel')],
          cancelButtonIndex: options.length,
          destructiveButtonIndex: isOwnPost ? undefined : options.length - 1,
        },
        (idx) => {
          if (idx < actions.length) actions[idx]();
        }
      );
    } else {
      Alert.alert(t('moreOptions'), '', [
        ...options.map((label, i) => ({ text: label, onPress: actions[i] })),
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}${t('daysAgo')}`;
    if (diffHours > 0) return `${diffHours}${t('hoursAgo')}`;
    return t('justNow');
  };

  const isLikedByCurrentUser = post.likedBy?.includes(currentUser.id) || false;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        {isSystemPost ? (
          <View style={[styles.lusappIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.lusappIconText}>L</Text>
          </View>
        ) : (
          <UserAvatar uri={postAuthor?.avatar} size={48} onPress={() => postAuthor?.id && onUserPress(postAuthor.id)} />
        )}
        <View style={styles.headerText}>
          {post.type === 'new_race' ? (
            <Text style={[styles.userName, { color: colors.text }]}>{t('newRaceAdded')}</Text>
          ) : post.type === 'upcoming_race' ? (
            <Text style={[styles.userName, { color: colors.text }]}>{t('upcomingRaceLabel')}</Text>
          ) : (
            <TouchableOpacity onPress={() => postAuthor?.id && onUserPress(postAuthor.id)}>
              <Text style={[styles.userName, { color: colors.text }]}>{postAuthor?.name}</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTime(post.timestamp)}
          </Text>
        </View>

        {!isSystemPost && (
          <TouchableOpacity style={styles.moreButton} onPress={handleMoreOptions} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.moreIcon, { color: colors.textSecondary }]}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {isSystemPost ? (
          <View>
            <Text style={[styles.activityText, { color: colors.text }]}>
              🏁 {post.type === 'upcoming_race' ? t('checkOutThisRace') : t('newRaceAvailable')}{' '}
              <Text style={[styles.raceLink, { color: colors.primary }]} onPress={() => race && onRacePress(race.id)}>
                {race?.name || post.raceName || t('aRace')}
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
            🎯 {t('signedUpFor')}{' '}
            <Text style={[styles.raceLink, { color: colors.primary }]} onPress={() => race && onRacePress(race.id)}>
              {race?.name || t('aRace')}
            </Text>
          </Text>
        ) : post.type === 'race_created' ? (
          <Text style={[styles.activityText, { color: colors.text }]}>
            🆕 {t('addedNewRace')}{' '}
            <Text style={[styles.raceLink, { color: colors.primary }]} onPress={() => race && onRacePress(race.id)}>
              {race?.name || post.raceName || t('aRace')}
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
              🏆 {t('completedRace')}{' '}
              <Text style={[styles.raceLink, { color: colors.primary }]}>
                {post.raceName || race?.name || t('aRace')}
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
            {post.likedBy?.length || 0} {post.likedBy?.length === 1 ? t('likeSingular') : t('likePlural')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setShowComments(!showComments)}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.comments?.length || 0} {post.comments?.length === 1 ? t('commentSingular') : t('commentPlural')}
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
              placeholder={t('addAComment')}
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleAddComment}
            >
              <Text style={styles.sendButtonText}>{t('send')}</Text>
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
  moreButton: {
    paddingLeft: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  moreIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
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
