import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { UserAvatar } from '../components/UserAvatar';
import { StatCard } from '../components/StatCard';
import { RaceCard } from '../components/RaceCard';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const ProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user: authUser, logout, updateUser, token } = useAuth();
  const races = useAppStore((state) => state.races);
  const [uploading, setUploading] = useState(false);

  if (!authUser) return null;

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

  const joinedRaces = races.filter((race) =>
    authUser.joinedRaces?.includes(race.id)
  );

  const completedRaces = races.filter((race) =>
    authUser.completedRaces?.includes(race.id)
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
        {authUser.avatar ? (
          <UserAvatar uri={authUser.avatar} size={100} />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        
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

        <Text style={styles.name}>{authUser.name}</Text>
        <Text style={styles.location}>📍 {authUser.location}</Text>
        <Text style={styles.bio}>{authUser.bio}</Text>
        
        <View style={styles.followInfo}>
          <View style={styles.followStat}>
            <Text style={styles.followNumber}>{authUser.followers?.length || 0}</Text>
            <Text style={styles.followLabel}>Followers</Text>
          </View>
          <View style={styles.followStat}>
            <Text style={styles.followNumber}>{authUser.following?.length || 0}</Text>
            <Text style={styles.followLabel}>Following</Text>
          </View>
        </View>
      </LinearGradient>

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
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
