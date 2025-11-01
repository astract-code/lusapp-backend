import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

import API_URL from '../config/api';

export const GearListDetailScreen = ({ route, navigation }) => {
  const { groupId, listId, listTitle, listVisibility } = route.params;
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);
  const [userRole, setUserRole] = useState('member');
  const isPersonal = listVisibility === 'personal';

  useEffect(() => {
    navigation.setOptions({ title: listTitle });
    fetchItems();
    fetchUserRole();
  }, [listId]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.user_role || 'member');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching gear items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: newItemName.trim() }),
        }
      );

      if (response.ok) {
        setShowAddModal(false);
        setNewItemName('');
        fetchItems();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to add item');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    } finally {
      setAdding(false);
    }
  };

  const updateItemStatus = async (itemId, currentStatus) => {
    const statusOrder = isPersonal 
      ? ['needed', 'completed']
      : ['needed', 'claimed', 'completed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items/${itemId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchItems();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const deleteItem = async (itemId, addedById) => {
    const canDelete =
      user.id === addedById || userRole === 'owner' || userRole === 'moderator';

    if (!canDelete) {
      Alert.alert('Error', 'You do not have permission to delete this item');
      return;
    }

    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items/${itemId}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            );

            if (response.ok) {
              fetchItems();
            } else {
              const error = await response.json();
              Alert.alert('Error', error.error || 'Failed to delete item');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const shareList = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/share`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        await Share.share({
          message: data.shareText,
        });
      } else {
        Alert.alert('Error', 'Failed to generate share text');
      }
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing list:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'needed':
        return colors.error;
      case 'claimed':
        return colors.warning;
      case 'completed':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'needed':
        return '⭕';
      case 'claimed':
        return '🔵';
      case 'completed':
        return '✅';
      default:
        return '⭕';
    }
  };

  const renderItem = ({ item }) => {
    const canDelete =
      user.id === item.added_by_id ||
      userRole === 'owner' ||
      userRole === 'moderator';

    return (
      <View
        style={[
          styles.itemContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => updateItemStatus(item.id, item.status)}
        >
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]}>
              {item.description}
            </Text>
            <View style={styles.itemMeta}>
              <Text
                style={[
                  styles.itemStatus,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status.toUpperCase()}
              </Text>
              {item.claimed_by_name && (
                <Text style={[styles.claimedBy, { color: colors.textSecondary }]}>
                  • {item.claimed_by_name}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item.id, item.added_by_id)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={shareList}
        >
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={[styles.shareButtonText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No items yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Add items to this gear list
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add Gear Item
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
              placeholder="Item name *"
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewItemName('');
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
                  adding && { opacity: 0.6 },
                ]}
                onPress={addItem}
                disabled={adding}
              >
                <Text style={styles.modalButtonText}>
                  {adding ? 'Adding...' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  shareIcon: {
    fontSize: 16,
  },
  shareButtonText: {
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemStatus: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  claimedBy: {
    fontSize: FONT_SIZE.sm,
    marginLeft: SPACING.xs,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  deleteIcon: {
    fontSize: 20,
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
