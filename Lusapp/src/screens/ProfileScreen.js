import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { UserAvatar } from '../components/UserAvatar';
import { StatCard } from '../components/StatCard';
import { CompactRaceCard } from '../components/CompactRaceCard';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user: authUser, logout, updateUser, token, refreshUser } = useAuth();
  const { races, fetchRaces } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [completionDataMap, setCompletionDataMap] = useState({});
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    bio: '',
    location: '',
    favoriteSport: '',
  });

  const fetchCompletionData = useCallback(async () => {
    if (!token || !authUser?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${authUser.id}/completions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const completions = await response.json();
        const dataMap = {};
        completions.forEach(c => {
          dataMap[c.race_id.toString()] = c;
        });
        setCompletionDataMap(dataMap);
      }
    } catch (error) {
      console.error('Error fetching completion data:', error);
    }
  }, [token, authUser?.id]);

  useEffect(() => {
    fetchCompletionData();
  }, [fetchCompletionData]);

  if (!authUser) return null;

  React.useEffect(() => {
    if (authUser) {
      setEditedProfile({
        name: authUser.name || '',
        bio: authUser.bio || '',
        location: authUser.location || '',
        favoriteSport: authUser.favoriteSport || '',
      });
    }
  }, [authUser]);

  const pickAndUploadImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      setUploading(true);

      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: filename,
        type,
      });

      const response = await fetch(`${API_URL}/api/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      
      if (!data.avatar) {
        throw new Error('No avatar URL returned from server');
      }

      const avatarUrl = data.avatar.startsWith('http') ? data.avatar : `${API_URL}${data.avatar}`;
      updateUser({ ...authUser, avatar: avatarUrl });
      Alert.alert('Success', 'Profile photo updated!');

    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProfile.name.trim(),
          bio: editedProfile.bio.trim(),
          location: editedProfile.location.trim(),
          favoriteSport: editedProfile.favoriteSport.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      const updatedUser = {
        ...authUser,
        name: data.user.name,
        bio: data.user.bio,
        location: data.user.location,
        favoriteSport: data.user.favoriteSport,
      };
      
      updateUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      name: authUser.name || '',
      bio: authUser.bio || '',
      location: authUser.location || '',
      favoriteSport: authUser.favoriteSport || '',
    });
    setIsEditing(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const joinedRaceIds = (authUser.joined_races || []).map(id => id.toString());
  const completedRaceIds = (authUser.completed_races || []).map(id => id.toString());

  const upcomingRaces = races.filter((race) => {
    const raceDate = new Date(race.date);
    raceDate.setHours(0, 0, 0, 0);
    return joinedRaceIds.includes(race.id.toString()) && raceDate >= today;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastUncompletedRaces = races.filter((race) => {
    const raceDate = new Date(race.date);
    raceDate.setHours(0, 0, 0, 0);
    const isJoined = joinedRaceIds.includes(race.id.toString());
    const isCompleted = completedRaceIds.includes(race.id.toString());
    return isJoined && raceDate < today && !isCompleted;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const completedRaces = races.filter((race) =>
    completedRaceIds.includes(race.id.toString())
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleMarkComplete = (race) => {
    navigation.navigate('RaceDetail', { raceId: race.id, openCompletionModal: true });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRaces(),
      refreshUser(),
      fetchCompletionData(),
    ]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Profile</Text>
        <View style={styles.topBarButtons}>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editIconButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={{ fontSize: 20 }}>✏️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarSection}>
            <UserAvatar uri={authUser.avatar} size={100} />
            
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: colors.primary }]}
              onPress={pickAndUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>
                  {authUser.avatar ? 'Change Photo' : 'Upload Photo'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}
                  value={editedProfile.name}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Location</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}
                  value={editedProfile.location}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, location: text })}
                  placeholder="e.g., San Francisco, CA"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bio</Text>
                <TextInput
                  style={[styles.textArea, { 
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Favorite Sport</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}
                  value={editedProfile.favoriteSport}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, favoriteSport: text })}
                  placeholder="e.g., Marathon, Triathlon"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={50}
                />
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
                  onPress={handleCancelEdit}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveProfile}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: colors.text }]}>{authUser.name}</Text>
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                📍 {authUser.location || 'Location not set'}
              </Text>
              <Text style={[styles.bio, { color: colors.textSecondary }]}>
                {authUser.bio || 'No bio yet'}
              </Text>
              
              <View style={styles.followInfo}>
                <View style={styles.followStat}>
                  <Text style={[styles.followNumber, { color: colors.text }]}>
                    {authUser.followers?.length || 0}
                  </Text>
                  <Text style={[styles.followLabel, { color: colors.textSecondary }]}>Followers</Text>
                </View>
                <View style={styles.followStat}>
                  <Text style={[styles.followNumber, { color: colors.text }]}>
                    {authUser.following?.length || 0}
                  </Text>
                  <Text style={[styles.followLabel, { color: colors.textSecondary }]}>Following</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <StatCard
            icon="🏆"
            label="Total Races"
            value={authUser.totalRaces || 0}
          />
          <StatCard
            icon="❤️"
            label="Favorite Sport"
            value={authUser.favoriteSport || 'Not set'}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Races ({upcomingRaces.length})
          </Text>
          {upcomingRaces.map((race) => (
            <CompactRaceCard
              key={race.id}
              race={race}
              onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
            />
          ))}
          {upcomingRaces.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No upcoming races
            </Text>
          )}
        </View>

        {pastUncompletedRaces.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Past Races - Mark as Complete ({pastUncompletedRaces.length})
            </Text>
            {pastUncompletedRaces.map((race) => (
              <CompactRaceCard
                key={race.id}
                race={race}
                onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
                isPastUncompleted={true}
                onMarkComplete={() => handleMarkComplete(race)}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Completed Races ({completedRaces.length})
          </Text>
          {completedRaces.map((race) => (
            <CompactRaceCard
              key={race.id}
              race={race}
              onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
              isCompleted={true}
              completionData={completionDataMap[race.id.toString()]}
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

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version {Constants.expoConfig?.version || '1.0.0'} ({Platform.OS === 'ios' 
              ? Constants.expoConfig?.ios?.buildNumber || '1'
              : Constants.expoConfig?.android?.versionCode || '1'})
          </Text>
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  topBarButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  editIconButton: {
    padding: SPACING.xs,
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  avatarSection: {
    alignItems: 'center',
  },
  uploadButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 120,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
  },
  location: {
    fontSize: FONT_SIZE.md,
    marginTop: SPACING.xs,
  },
  bio: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  followInfo: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.xxxl,
  },
  followStat: {
    alignItems: 'center',
  },
  followNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  followLabel: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  editContainer: {
    marginTop: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  textArea: {
    fontSize: FONT_SIZE.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  logoutButton: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  versionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});
