import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { UserAvatar } from '../components/UserAvatar';
import { StatCard } from '../components/StatCard';
import { RaceCard } from '../components/RaceCard';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user: authUser, logout } = useAuth();
  const races = useAppStore((state) => state.races);
  const user = useAppStore((state) => 
    state.users.find((u) => u.id === authUser?.id)
  );

  if (!user || !authUser) return null;

  const joinedRaces = races.filter((race) =>
    user.joinedRaces?.includes(race.id)
  );

  const completedRaces = races.filter((race) =>
    user.completedRaces?.includes(race.id)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={{ fontSize: 24 }}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <ScrollView>
        <LinearGradient
        colors={[colors.gradient1, colors.gradient2]}
        style={styles.header}
      >
        <UserAvatar uri={user.avatar} size={100} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.location}>📍 {user.location}</Text>
        <Text style={styles.bio}>{user.bio}</Text>
        
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
            No joined races yet
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
            No completed races yet
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error }]}
        onPress={logout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  topBarTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: SPACING.xs,
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
  logoutButton: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
});
