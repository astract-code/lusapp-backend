import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAvatar } from '../components/UserAvatar';
import { StatCard } from '../components/StatCard';
import { RaceCard } from '../components/RaceCard';
import { useAppStore } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const { getUserById, races, toggleFollow } = useAppStore();

  const user = getUserById(userId);
  const currentUserData = getUserById(currentUser?.id);
  
  const isFollowing = currentUserData?.following?.includes(userId);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>User not found</Text>
      </View>
    );
  }

  const joinedRaces = races.filter((race) =>
    user.joinedRaces?.includes(race.id)
  );

  const completedRaces = races.filter((race) =>
    user.completedRaces?.includes(race.id)
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
              onPress={() => toggleFollow(currentUser.id, userId)}
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
