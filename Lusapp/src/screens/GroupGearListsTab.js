import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const GroupGearListsTab = ({ groupId, navigation, userRole }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [gearLists, setGearLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGearLists();
  }, [groupId]);

  const fetchGearLists = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}/gear-lists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGearLists(data.gear_lists || []);
      }
    } catch (error) {
      console.error('Error fetching gear lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGearList = async () => {
    if (!newListTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the gear list');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}/gear-lists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newListTitle.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewListTitle('');
        fetchGearLists();
        navigation.navigate('GearListDetail', {
          groupId,
          listId: data.gear_list.id,
          listTitle: data.gear_list.title,
        });
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create gear list');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create gear list');
    } finally {
      setCreating(false);
    }
  };

  const renderGearList = ({ item }) => (
    <TouchableOpacity
      style={[styles.gearListItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() =>
        navigation.navigate('GearListDetail', {
          groupId,
          listId: item.id,
          listTitle: item.title,
        })
      }
    >
      <View style={styles.gearListHeader}>
        <Text style={[styles.gearListTitle, { color: colors.text }]}>{item.title}</Text>
        {item.race_name && (
          <Text style={[styles.raceName, { color: colors.textSecondary }]}>
            🏁 {item.race_name}
          </Text>
        )}
      </View>
      <View style={styles.gearListFooter}>
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
          📦 {item.item_count || 0} {item.item_count === 1 ? 'item' : 'items'}
        </Text>
        <Text style={[styles.createdBy, { color: colors.textSecondary }]}>
          by {item.created_by_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ New Gear List</Text>
        </TouchableOpacity>
      </View>

      {gearLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎒</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No gear lists yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create a gear list to organize equipment for your races
          </Text>
        </View>
      ) : (
        <FlatList
          data={gearLists}
          renderItem={renderGearList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showCreateModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Gear List
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Gear list title *"
              placeholderTextColor={colors.textSecondary}
              value={newListTitle}
              onChangeText={setNewListTitle}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewListTitle('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                  creating && { opacity: 0.6 },
                ]}
                onPress={createGearList}
                disabled={creating}
              >
                <Text style={styles.modalButtonText}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.md,
  },
  createButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  gearListItem: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  gearListHeader: {
    marginBottom: SPACING.sm,
  },
  gearListTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  raceName: {
    fontSize: FONT_SIZE.sm,
  },
  gearListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: FONT_SIZE.sm,
  },
  createdBy: {
    fontSize: FONT_SIZE.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '600',
  },
});
