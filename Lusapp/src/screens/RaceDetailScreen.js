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
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SPORTS } from '../constants/theme';
import API_URL from '../config/api';

export const RaceDetailScreen = ({ route, navigation }) => {
  const { raceId } = route.params;
  const { colors } = useTheme();
  const { user, token, updateUser } = useAuth();
  const { getRaceById, registerForRace, unregisterFromRace } = useAppStore();
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const race = getRaceById(raceId);

  if (!race) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Race not found</Text>
      </View>
    );
  }
  
  const formatTime = (time) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const sport = SPORTS.find((s) => s.id === race.sport) || SPORTS[0];
  const isRegistered = race.registeredUsers?.includes(user?.id);
  
  const shouldShowDistance = () => {
    const category = race.sport_category?.toLowerCase() || '';
    const subtype = race.sport_subtype?.toLowerCase() || '';
    const nonDistanceSports = ['hyrox', 'crossfit', 'obstacle', 'spartan'];
    return !nonDistanceSports.some(sport => 
      category.includes(sport) || subtype.includes(sport)
    );
  };
  
  const getSubtitle = () => {
    const category = race.sport_category || '';
    const subtype = race.sport_subtype || '';
    if (category.toLowerCase().includes('hyrox')) {
      return category;
    }
    return subtype || category || sport.name;
  };
  
  useEffect(() => {
    fetchRegisteredUsers();
  }, [race.registeredUsers]);

  const fetchRegisteredUsers = async () => {
    if (!race.registeredUsers || race.registeredUsers.length === 0) {
      setRegisteredUsers([]);
      setLoadingUsers(false);
      return;
    }

    try {
      const userIds = race.registeredUsers.join(',');
      const response = await fetch(`${API_URL}/api/auth/users/batch?ids=${userIds}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRegisteredUsers(data.users || []);
      } else {
        setRegisteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching registered users:', error);
      setRegisteredUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRegister = async () => {
    if (!user) return;

    try {
      const endpoint = isRegistered 
        ? `${API_URL}/api/races/${raceId}/leave`
        : `${API_URL}/api/races/${raceId}/join`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('Success', isRegistered ? 'You have unregistered from this race' : 'You have registered for this race!');
        
        if (isRegistered) {
          unregisterFromRace(raceId, user.id);
          updateUser({
            ...user,
            joinedRaces: (user.joinedRaces || []).filter(id => id !== raceId)
          });
        } else {
          registerForRace(raceId, user.id);
          updateUser({
            ...user,
            joinedRaces: [...(user.joinedRaces || []), raceId]
          });
        }
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to update registration');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      Alert.alert('Error', 'Failed to update registration');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.gradient1, colors.gradient2]}
        style={styles.header}
      >
        <Text style={styles.sportIcon}>{sport.icon}</Text>
        <Text style={styles.title}>{race.name}</Text>
        <Text style={styles.sport}>{getSubtitle()}</Text>
      </LinearGradient>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.infoRow}>
          <Text style={styles.icon}>📍</Text>
          <View style={styles.infoText}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {race.city}, {race.country}
            </Text>
            <Text style={[styles.subValue, { color: colors.textSecondary }]}>
              {race.continent}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.icon}>📅</Text>
          <View style={styles.infoText}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {new Date(race.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {race.start_time && (
          <View style={styles.infoRow}>
            <Text style={styles.icon}>⏰</Text>
            <View style={styles.infoText}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Start Time</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatTime(race.start_time)}</Text>
            </View>
          </View>
        )}

        {shouldShowDistance() && race.distance && (
          <View style={styles.infoRow}>
            <Text style={styles.icon}>📏</Text>
            <View style={styles.infoText}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Distance</Text>
              <Text style={[styles.value, { color: colors.text }]}>{race.distance}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.icon}>👥</Text>
          <View style={styles.infoText}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Participants</Text>
            <Text style={[styles.value, { color: colors.text }]}>{race.participants}</Text>
          </View>
        </View>
      </View>

      {race.description && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {race.description}
          </Text>
        </View>
      )}

      {registeredUsers.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Registered Athletes ({registeredUsers.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {registeredUsers.map((athlete) => (
              <TouchableOpacity
                key={athlete.id}
                style={styles.athleteItem}
                onPress={() => navigation.navigate('UserProfile', { userId: athlete.id })}
              >
                <UserAvatar uri={athlete.avatar} size={60} />
                <Text style={[styles.athleteName, { color: colors.text }]} numberOfLines={1}>
                  {athlete.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.registerButton,
          { backgroundColor: isRegistered ? colors.textSecondary : colors.primary },
        ]}
        onPress={handleRegister}
      >
        <Text style={styles.registerButtonText}>
          {isRegistered ? 'Unregister' : 'Sign Up for Race'}
        </Text>
      </TouchableOpacity>
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
  sportIcon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  sport: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  card: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  infoText: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  subValue: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  athleteItem: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 70,
  },
  athleteName: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  registerButton: {
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
});
