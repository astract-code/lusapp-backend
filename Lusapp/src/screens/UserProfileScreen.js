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
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { colors } = useTheme();
  const { user: currentUser, token } = useAuth();
  const { races, toggleFollow } = useAppStore();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile:', userId);
      const response = await fetch(`${API_URL}/api/auth/users/batch?ids=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User profile data:', data);
        if (data.users && data.users.length > 0) {
          const fetchedUser = data.users[0];
          setUser(fetchedUser);
          
          const isUserFollowed = fetchedUser.followers?.includes(currentUser.id.toString()) || 
                                 fetchedUser.followers?.includes(currentUser.id);
          setIsFollowing(isUserFollowed);
        }
      } else {
        console.error('Failed to fetch user profile');
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
        Alert.alert('Error', error.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
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
        <Text style={[styles.errorText, { color: colors.text }]}>User not found</Text>
      </View>
    );
  }

  const joinedRaces = races.filter((race) =>
    user.joinedRaces?.includes(race.id.toString())
  );

  const completedRaces = races.filter((race) =>
    user.completedRaces?.includes(race.id.toString())
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradient1, colors.gradient2]}
        style={styles.header}
      >
        <UserAvatar uri={user.avatar} size={100} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.location}>📍 {user.location}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        
        <View style={styles.followInfo}>
          <View style={styles.followStat}>
            <Text style={styles.followNumber}>{user.followers?.length || 0}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
          <View style={styles.followStat}>
            <Text style={styles.followNumber}>{user.following?.length || 0}</Text>
            <Text style={styles.followLabel}>Following</Text>
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
                {isFollowing ? 'Following' : 'Follow'}
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
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <View style={styles.stats}>
        <StatCard
          icon="🏆"
          label="Total Races"
          value={user.totalRaces}
        />
        <StatCard
          icon="❤️"
          label="Favorite Sport"
          value={user.favoriteSport}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Joined Races ({joinedRaces.length})
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
            No joined races
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Completed Races ({completedRaces.length})
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
            No completed races
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
    opacity: 0.9,
  },
  bio: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    marginTop: SPACING.sm,
    textAlign: 'center',
    opacity: 0.9,
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
    opacity: 0.9,
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
});
