import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { UserAvatar } from '../components/UserAvatar';
import { StatCard } from '../components/StatCard';
import { CompactRaceCard } from '../components/CompactRaceCard';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS, GRADIENTS, SHADOWS } from '../constants/theme';
import API_URL from '../config/api';
import haptic from '../utils/haptics';

const { width } = Dimensions.get('window');

export const ProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
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

  const headerAnim = useRef(new Animated.Value(0)).current;

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
    haptic.light();
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
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
      haptic.success();
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
      haptic.success();
      Alert.alert('Success', 'Profile updated!');
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

  const joinedRaceIds = (authUser.joinedRaces || authUser.joined_races || []).map(id => id.toString());
  const completedRaceIds = (authUser.completedRaces || authUser.completed_races || []).map(id => id.toString());

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

  const getBestDistance = () => {
    if (completedRaces.length === 0) return '-';
    
    let maxDistance = 0;
    completedRaces.forEach(race => {
      const dist = parseFloat(race.distance) || 0;
      if (dist > maxDistance) {
        maxDistance = dist;
      }
    });
    
    if (maxDistance === 0) return '-';
    if (maxDistance >= 1000) return `${Math.round(maxDistance / 1000)}k`;
    if (maxDistance >= 100) return `${Math.round(maxDistance)}`;
    if (maxDistance >= 42.195) return '42.2';
    if (maxDistance >= 21.0975) return '21.1';
    return `${maxDistance}`;
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
    <View style={[styles.container, { backgroundColor: isDark ? '#0B0F1A' : colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#0B0F1A', '#1E293B'] : [colors.background, colors.surface]}
        style={styles.backgroundGradient}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={[styles.topBarTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.topBarButtons}>
            {!isEditing && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                onPress={() => { haptic.light(); setIsEditing(true); }}
              >
                <Ionicons name="create-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
              onPress={() => { haptic.light(); navigation.navigate('Settings'); }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <UserAvatar uri={authUser.avatar} size={100} />
              <TouchableOpacity 
                style={styles.uploadBadge}
                onPress={pickAndUploadImage}
                disabled={uploading}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  style={styles.uploadBadgeGradient}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <View style={styles.editContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Name</Text>
                  <TextInput
                    style={[styles.input, { 
                      color: colors.text,
                      backgroundColor: isDark ? colors.surface : '#F8FAFC',
                      borderColor: isDark ? colors.border : '#E2E8F0',
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
                      backgroundColor: isDark ? colors.surface : '#F8FAFC',
                      borderColor: isDark ? colors.border : '#E2E8F0',
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
                      backgroundColor: isDark ? colors.surface : '#F8FAFC',
                      borderColor: isDark ? colors.border : '#E2E8F0',
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
                      backgroundColor: isDark ? colors.surface : '#F8FAFC',
                      borderColor: isDark ? colors.border : '#E2E8F0',
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
                    style={[styles.cancelButton, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveProfile}>
                    <LinearGradient
                      colors={GRADIENTS.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveButton}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: colors.text }]}>{authUser.name}</Text>
                
                {authUser.location && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#4ADE80" style={styles.locationIcon} />
                    <Text style={[styles.location, { color: colors.textSecondary }]}>
                      {authUser.location}
                    </Text>
                  </View>
                )}
                
                {authUser.bio && (
                  <Text style={[styles.bio, { color: colors.textSecondary }]}>
                    {authUser.bio}
                  </Text>
                )}
                
                <View style={styles.followInfo}>
                  <TouchableOpacity style={styles.followStat}>
                    <Text style={[styles.followNumber, { color: colors.text }]}>
                      {authUser.followers?.length || 0}
                    </Text>
                    <Text style={[styles.followLabel, { color: colors.textTertiary }]}>Followers</Text>
                  </TouchableOpacity>
                  <View style={[styles.followDivider, { backgroundColor: colors.border }]} />
                  <TouchableOpacity style={styles.followStat}>
                    <Text style={[styles.followNumber, { color: colors.text }]}>
                      {authUser.following?.length || 0}
                    </Text>
                    <Text style={[styles.followLabel, { color: colors.textTertiary }]}>Following</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <StatCard
              icon="trophy"
              label="Joined"
              value={joinedRaceIds.length || 0}
              color="#4ADE80"
            />
            <StatCard
              icon="check"
              label="Completed"
              value={completedRaces.length || 0}
              color="#38BDF8"
            />
            <StatCard
              icon="target"
              label="Best (km)"
              value={getBestDistance()}
              color="#FBBF24"
            />
          </View>

          {upcomingRaces.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#4ADE80' }]}>
                  <Text style={styles.sectionBadgeText}>{upcomingRaces.length}</Text>
                </View>
              </View>
              {upcomingRaces.slice(0, 3).map((race) => (
                <CompactRaceCard
                  key={race.id}
                  race={race}
                  onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
                />
              ))}
            </View>
          )}

          {pastUncompletedRaces.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Mark Complete</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#FBBF24' }]}>
                  <Text style={styles.sectionBadgeText}>{pastUncompletedRaces.length}</Text>
                </View>
              </View>
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

          {completedRaces.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed</Text>
                <View style={[styles.sectionBadge, { backgroundColor: '#38BDF8' }]}>
                  <Text style={styles.sectionBadgeText}>{completedRaces.length}</Text>
                </View>
              </View>
              {completedRaces.slice(0, 5).map((race) => (
                <CompactRaceCard
                  key={race.id}
                  race={race}
                  onPress={() => navigation.navigate('RaceDetail', { raceId: race.id })}
                  isCompleted={true}
                  completionData={completionDataMap[race.id.toString()]}
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              haptic.warning();
              logout();
            }}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.versionContainer}>
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>
              Version {Constants.expoConfig?.version || '1.0.0'} ({Platform.OS === 'ios' 
                ? Constants.expoConfig?.ios?.buildNumber || '1'
                : Constants.expoConfig?.android?.versionCode || '1'})
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  topBarTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  topBarButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 18,
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  uploadBadgeGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0B0F1A',
  },
  uploadBadgeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationIcon: {
    fontSize: 12,
    color: '#4ADE80',
    marginRight: SPACING.xs,
  },
  location: {
    fontSize: 14,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  followInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followStat: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  followDivider: {
    width: 1,
    height: 30,
  },
  followNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  followLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  editContainer: {
    width: '100%',
    marginTop: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  textArea: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionBadge: {
    marginLeft: SPACING.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  versionText: {
    fontSize: 12,
  },
});
