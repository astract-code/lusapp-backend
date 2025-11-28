import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SPORTS } from '../constants/theme';
import API_URL from '../config/api';
import { getDisplayDistance } from '../utils/distanceHelper';

export const RaceDetailScreen = ({ route, navigation }) => {
  const { raceId, openCompletionModal } = route.params;
  const { colors } = useTheme();
  const { user, token, updateUser } = useAuth();
  const { getRaceById, registerForRace, unregisterFromRace, fetchRaces } = useAppStore();
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [raceGroup, setRaceGroup] = useState(null);
  
  const [completion, setCompletion] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionTime, setCompletionTime] = useState('');
  const [position, setPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const race = getRaceById(raceId);
  
  const isPastRace = race && new Date(race.date) < new Date();
  const isCompleted = user?.completed_races?.includes(raceId.toString());

  // Refresh race data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRaces();
    }, [])
  );

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
  const isRegistered = race.registeredUsers?.includes(user?.id?.toString());
  
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
    if (isRegistered) {
      fetchRaceGroup();
    }
    if (isCompleted) {
      fetchCompletion();
    }
  }, [race.registeredUsers, isRegistered, isCompleted]);

  useEffect(() => {
    if (openCompletionModal && isPastRace && isRegistered && !isCompleted && !hasAutoOpened) {
      setShowCompletionModal(true);
      setHasAutoOpened(true);
    }
  }, [openCompletionModal, isPastRace, isRegistered, isCompleted, hasAutoOpened]);

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

  const fetchRaceGroup = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/race/${raceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRaceGroup(data.group);
      }
    } catch (error) {
      console.error('Error fetching race group:', error);
    }
  };

  const fetchCompletion = async () => {
    try {
      const response = await fetch(`${API_URL}/api/races/${raceId}/completion`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompletion(data);
        setCompletionTime(data.completion_time || '');
        setPosition(data.position?.toString() || '');
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error fetching completion:', error);
    }
  };

  const handlePickCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setCertificate(result.assets[0]);
        Alert.alert('Success', 'Certificate selected');
      }
    } catch (error) {
      console.error('Error picking certificate:', error);
      Alert.alert('Error', 'Failed to pick certificate');
    }
  };

  const handleMarkComplete = () => {
    setShowCompletionModal(true);
  };

  const handleSubmitCompletion = async () => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      if (completionTime) formData.append('completion_time', completionTime);
      if (position) formData.append('position', position);
      if (notes) formData.append('notes', notes);
      
      if (certificate) {
        formData.append('certificate', {
          uri: certificate.uri,
          type: 'application/pdf',
          name: certificate.name || 'certificate.pdf',
        });
      }

      const response = await fetch(`${API_URL}/api/races/${raceId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCompletion(data.completion);
        updateUser({
          ...user,
          completed_races: [...(user.completed_races || []), raceId.toString()]
        });
        setShowCompletionModal(false);
        Alert.alert('Success', 'Race marked as completed!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to mark race as completed');
      }
    } catch (error) {
      console.error('Error submitting completion:', error);
      Alert.alert('Error', 'Failed to submit completion');
    } finally {
      setSubmitting(false);
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
            joined_races: (user.joined_races || []).filter(id => id.toString() !== raceId.toString())
          });
        } else {
          registerForRace(raceId, user.id);
          updateUser({
            ...user,
            joined_races: [...(user.joined_races || []), raceId.toString()]
          });
          fetchRaceGroup();
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

        <View style={styles.infoRow}>
          <Text style={styles.icon}>📏</Text>
          <View style={styles.infoText}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Distance</Text>
            <Text style={[styles.value, { color: colors.text }]}>{getDisplayDistance(race)}</Text>
          </View>
        </View>

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

      {isCompleted && completion && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Race Completed ✓
            </Text>
          </View>
          {completion.completion_time && (
            <View style={styles.completionRow}>
              <Text style={[styles.completionLabel, { color: colors.textSecondary }]}>Finish Time:</Text>
              <Text style={[styles.completionValue, { color: colors.text }]}>{completion.completion_time}</Text>
            </View>
          )}
          {completion.position && (
            <View style={styles.completionRow}>
              <Text style={[styles.completionLabel, { color: colors.textSecondary }]}>Position:</Text>
              <Text style={[styles.completionValue, { color: colors.text }]}>{completion.position}</Text>
            </View>
          )}
          {completion.notes && (
            <View style={styles.completionRow}>
              <Text style={[styles.completionLabel, { color: colors.textSecondary }]}>Notes:</Text>
              <Text style={[styles.completionValue, { color: colors.text }]}>{completion.notes}</Text>
            </View>
          )}
          {completion.certificate_url && (
            <TouchableOpacity
              style={[styles.certificateButton, { backgroundColor: colors.primary }]}
              onPress={() => Linking.openURL(completion.certificate_url)}
            >
              <Text style={styles.certificateButtonText}>View Certificate PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isPastRace && (
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
      )}

      {isPastRace && isRegistered && !isCompleted && (
        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: colors.primary }]}
          onPress={handleMarkComplete}
        >
          <Text style={styles.registerButtonText}>Mark as Completed</Text>
        </TouchableOpacity>
      )}

      {isRegistered && raceGroup && (
        <TouchableOpacity
          style={[styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Groups', {
            screen: 'GroupDetail',
            params: { groupId: raceGroup.id }
          })}
        >
          <Text style={styles.chatButtonIcon}>💬</Text>
          <View style={styles.chatButtonText}>
            <Text style={styles.chatButtonTitle}>Race Chat</Text>
            <Text style={styles.chatButtonSubtitle}>
              Connect with {raceGroup.member_count} participants
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <Modal
        visible={showCompletionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Mark Race as Completed</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Finish Time (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 3:45:30 or 03:45:30"
              placeholderTextColor={colors.textSecondary}
              value={completionTime}
              onChangeText={setCompletionTime}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Position (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 42"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={position}
              onChangeText={setPosition}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="How was the race? Any memorable moments?"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity
              style={[styles.pickCertificateButton, { borderColor: colors.primary }]}
              onPress={handlePickCertificate}
            >
              <Text style={[styles.pickCertificateText, { color: colors.primary }]}>
                {certificate ? '✓ Certificate Selected' : '📄 Upload Certificate PDF (optional)'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => setShowCompletionModal(false)}
                disabled={submitting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSubmitCompletion}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  chatButton: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButtonIcon: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  chatButtonText: {
    flex: 1,
  },
  chatButtonTitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  chatButtonSubtitle: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    opacity: 0.9,
  },
  errorText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
  completionHeader: {
    marginBottom: SPACING.md,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  completionLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  completionValue: {
    fontSize: FONT_SIZE.md,
  },
  certificateButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  certificateButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickCertificateButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  pickCertificateText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
  },
});
