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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';

export const GearListDetailScreen = ({ route, navigation }) => {
  const { groupId, listId, listTitle, listVisibility } = route.params;
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);
  const [userRole, setUserRole] = useState('member');
  const isPrivate = listVisibility === 'personal';

  useEffect(() => {
    navigation.setOptions({ title: listTitle });
    fetchItems();
    fetchUserRole();
  }, [listId]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
        { headers: { 'Authorization': `Bearer ${token}` } }
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
      Alert.alert(t('oops'), t('pleaseEnterItemName'));
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
        Alert.alert(t('oops'), error.error || t('failedToAddItem'));
      }
    } catch (error) {
      Alert.alert(t('oops'), t('failedToAddItem'));
    } finally {
      setAdding(false);
    }
  };

  const toggleTick = async (itemId) => {
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, my_tick: !i.my_tick } : i)
    );
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items/${itemId}/tick`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        setItems(prev =>
          prev.map(i => i.id === itemId ? { ...i, my_tick: !i.my_tick } : i)
        );
        const error = await response.json();
        Alert.alert(t('oops'), error.error || t('failedToUpdateItem'));
      }
    } catch (error) {
      setItems(prev =>
        prev.map(i => i.id === itemId ? { ...i, my_tick: !i.my_tick } : i)
      );
    }
  };

  const claimItem = async (itemId, currentClaimerId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items/${itemId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'claim' }),
        }
      );
      if (response.ok) {
        fetchItems();
      } else {
        const error = await response.json();
        Alert.alert(t('oops'), error.error || t('failedToUpdateItem'));
      }
    } catch (error) {
      Alert.alert(t('oops'), t('failedToUpdateItem'));
    }
  };

  const deleteItem = async (itemId, addedById) => {
    const canDelete =
      user.id === addedById || userRole === 'owner' || userRole === 'moderator';
    if (!canDelete) {
      Alert.alert(t('oops'), t('noPermissionToDelete'));
      return;
    }
    Alert.alert(t('deleteItem'), t('deleteItemConfirmation'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/items/${itemId}`,
              {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              }
            );
            if (response.ok) {
              fetchItems();
            } else {
              const error = await response.json();
              Alert.alert(t('oops'), error.error || t('failedToDeleteItem'));
            }
          } catch (error) {
            Alert.alert(t('oops'), t('failedToDeleteItem'));
          }
        },
      },
    ]);
  };

  const shareList = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/gear-lists/${listId}/share`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        await Share.share({ message: data.shareText });
      } else {
        Alert.alert(t('oops'), t('failedToGenerateShareText'));
      }
    } catch (error) {
      if (error.message !== 'User did not share') {
        console.error('Error sharing list:', error);
      }
    }
  };

  const renderItem = ({ item }) => {
    const canDelete =
      user.id === item.added_by_id ||
      userRole === 'owner' ||
      userRole === 'moderator';
    const isMyClaim = item.claimed_by_id === user.id;

    return (
      <View style={[styles.itemContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tickBox,
            {
              borderColor: item.my_tick ? colors.primary : colors.border,
              backgroundColor: item.my_tick ? colors.primary : 'transparent',
            },
          ]}
          onPress={() => toggleTick(item.id)}
        >
          {item.my_tick && (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <View style={styles.itemBody}>
          <Text
            style={[
              styles.itemName,
              { color: colors.text },
              item.my_tick && { textDecorationLine: 'line-through', color: colors.textSecondary },
            ]}
          >
            {item.description}
          </Text>

          {!isPrivate && item.claimed_by_name && (
            <Text style={[styles.claimedBy, { color: colors.textSecondary }]}>
              🔵 {t('claimedBy')} {item.claimed_by_name}
              {isMyClaim ? ` (${t('you')})` : ''}
            </Text>
          )}
        </View>

        {!isPrivate && (
          <TouchableOpacity
            style={[
              styles.claimButton,
              {
                backgroundColor: isMyClaim
                  ? colors.border
                  : item.claimed_by_id
                  ? colors.card
                  : colors.primary,
                borderColor: isMyClaim ? colors.border : item.claimed_by_id ? colors.primary : colors.primary,
                borderWidth: 1,
              },
            ]}
            onPress={() => claimItem(item.id, item.claimed_by_id)}
          >
            <Text
              style={[
                styles.claimButtonText,
                {
                  color: isMyClaim
                    ? colors.text
                    : item.claimed_by_id
                    ? colors.primary
                    : '#FFFFFF',
                },
              ]}
            >
              {isMyClaim ? t('unclaim') : item.claimed_by_id ? t('replace') : t('claim')}
            </Text>
          </TouchableOpacity>
        )}

        {canDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item.id, item.added_by_id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
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
          <Text style={styles.addButtonText}>+ {t('addItem')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={shareList}
        >
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={[styles.shareButtonText, { color: colors.primary }]}>{t('share')}</Text>
        </TouchableOpacity>
      </View>

      {!isPrivate && (
        <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            ☑ {t('myCheckboxLegend')}  •  🔵 {t('claimLegend')}
          </Text>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noItemsYet')}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('addItemsToGearList')}</Text>
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('addGearItem')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder={t('itemNameRequired')}
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => { setShowAddModal(false); setNewItemName(''); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }, adding && { opacity: 0.6 }]}
                onPress={addItem}
                disabled={adding}
              >
                <Text style={styles.modalButtonText}>
                  {adding ? t('adding') : t('add')}
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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  shareIcon: { fontSize: 16 },
  shareButtonText: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  legend: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  legendText: { fontSize: FONT_SIZE.sm, textAlign: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.lg },
  emptyText: { fontSize: FONT_SIZE.lg, fontWeight: '600', marginBottom: SPACING.sm, textAlign: 'center' },
  emptySubtext: { fontSize: FONT_SIZE.md, textAlign: 'center' },
  list: { padding: SPACING.md },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  tickBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: FONT_SIZE.md, fontWeight: '500' },
  claimedBy: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  claimButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    flexShrink: 0,
  },
  claimButtonText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  deleteButton: { padding: SPACING.xs, flexShrink: 0 },
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
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', marginBottom: SPACING.lg },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  modalButtonText: { color: '#FFFFFF', fontSize: FONT_SIZE.md, fontWeight: '600' },
});
