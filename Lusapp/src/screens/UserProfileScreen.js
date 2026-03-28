import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAvatar } from '../components/UserAvatar';
import { StatCard } from '../components/StatCard';
import { RaceCard } from '../components/RaceCard';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';
import { fetchWithAuth } from '../utils/apiClient';

export const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user: currentUser, token } = useAuth();
  const { races, toggleFollow } = useAppStore();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const [profileRes, blockedRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/users/batch?ids=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetchWithAuth(`${API_URL}/api/auth/users/blocked`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.users && data.users.length > 0) {
          const fetchedUser = data.users[0];
          setUser(fetchedUser);
          const isUserFollowed = fetchedUser.followers?.includes(currentUser.id.toString()) ||
                                 fetchedUser.followers?.includes(currentUser.id);
          setIsFollowing(isUserFollowed);
        }
      }

      if (blockedRes.ok) {
        const blockedData = await blockedRes.json();
        const blockedIds = (blockedData.blocked || []).map(String);
        setIsBlocked(blockedIds.includes(String(userId)));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const endpoint = isFollowing 
        ? `${API_URL}/api/auth/users/${userId}/unfollow`
        : `${API_URL}/api/auth/users/${userId}/follow`;
      
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        
        setUser(prevUser => ({
          ...prevUser,
          followers: isFollowing
            ? (prevUser.followers || []).filter(id => id !== currentUser.id.toString() && id !== currentUser.id)
            : [...(prevUser.followers || []), currentUser.id.toString()]
        }));
      } else {
        const error = await response.json();
        Alert.alert(t('oops'), error.error || t('failedToUpdateFollowStatus'));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert(t('oops'), t('failedToUpdateFollowStatus'));
    }
  };

  const handleToggleBlock = () => {
    if (isBlocked) {
      Alert.alert(t('unblockUser'), `Unblock ${user?.name}?`, [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('unblockUser'),
          onPress: async () => {
            try {
              await fetchWithAuth(`${API_URL}/api/auth/users/block/${userId}`, { method: 'DELETE' });
              setIsBlocked(false);
              Alert.alert('', t('userUnblocked'));
            } catch {
              Alert.alert(t('oops'), t('error'));
            }
          },
        },
      ]);
    } else {
      Alert.alert(t('blockUserConfirmTitle'), t('blockUserConfirmMsg'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('block'),
          style: 'destructive',
          onPress: async () => {
            try {
              await fetchWithAuth(`${API_URL}/api/auth/users/block/${userId}`, { method: 'POST' });
              setIsBlocked(true);
              Alert.alert('', t('userBlocked'));
            } catch {
              Alert.alert(t('oops'), t('error'));
            }
          },
        },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{t('userNotFound')}</Text>
      </View>
    );
  }

  // Normalize to strings for consistent comparison
  const userJoinedRaceIds = (user.joinedRaces || user.joined_races || []).map(String);
  const userCompletedRaceIds = (user.completedRaces || user.completed_races || []).map(String);
  
  const joinedRaces = races.filter((race) =>
    userJoinedRaceIds.includes(race.id.toString())
  );

  const completedRaces = races.filter((race) =>
    userCompletedRaceIds.includes(race.id.toString())
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#0B0F1A', '#1E3A5A']}
        style={styles.header}
      >
        <UserAvatar uri={user.avatar} size={100} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.location}>📍 {user.location}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        
        <View style={styles.followInfo}>
          <View style={styles.followStat}>
            <Text style={styles.followNumber}>{user.followers?.length || 0}</Text>
            <Text style={styles.followLabel}>{t('followers')}</Text>
          </View>
          <View style={styles.followStat}>
            <Text style={styles.followNumber}>{user.following?.length || 0}</Text>
            <Text style={styles.followLabel}>{t('following')}</Text>
          </View>
        </View>

        {currentUser.id !== userId && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.followButton,
                { backgroundColor: isFollowing ? colors.background : colors.primary }
              ]}
              onPress={handleToggleFollow}
            >
              <Text style={[
                styles.followButtonText,
                { color: isFollowing ? colors.text : '#FFFFFF' }
              ]}>
                {isFollowing ? t('following') : t('follow')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.messageButton, { borderColor: '#FFFFFF' }]}
              onPress={() => navigation.navigate('Chat', { 
                userId: user.id, 
                userName: user.name,
                userAvatar: user.avatar
              })}
            >
              <Text style={styles.messageButtonText}>{t('message')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {currentUser.id !== userId && (
          <TouchableOpacity
            style={[styles.blockButton, { borderColor: isBlocked ? '#EF4444' : 'rgba(255,255,255,0.3)' }]}
            onPress={handleToggleBlock}
          >
            <Text style={[styles.blockButtonText, { color: isBlocked ? '#EF4444' : 'rgba(255,255,255,0.6)' }]}>
              {isBlocked ? t('unblockUser') : t('blockUser')}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={styles.stats}>
        <StatCard
          icon="🏆"
          label={t('totalRaces')}
          value={user.totalRaces}
        />
        <StatCard
          icon="❤️"
          label={t('favoriteSport')}
          value={user.favoriteSport}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('joinedRaces')} ({joinedRaces.length})
        </Text>
        {joinedRaces.map((race) => (
          <RaceCard
            key={race.id}
            race={race}
            onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
          />
        ))}
        {joinedRaces.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noJoinedRaces')}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('completedRaces')} ({completedRaces.length})
        </Text>
        {completedRaces.map((race) => (
          <RaceCard
            key={race.id}
            race={race}
            onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
          />
        ))}
        {completedRaces.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noCompletedRaces')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  name: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  location: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    marginTop: SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  followInfo: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.xl,
  },
  followStat: {
    alignItems: 'center',
  },
  followNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  followLabel: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    marginTop: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  followButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  messageButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stats: {
    flexDirection: 'row',
    padding: SPACING.md,
    marginTop: -SPACING.lg,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
  blockButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  blockButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
