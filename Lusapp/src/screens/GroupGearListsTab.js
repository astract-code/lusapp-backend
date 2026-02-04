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
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

import API_URL from '../config/api';

export const GroupGearListsTab = ({ groupId, navigation, userRole }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [gearLists, setGearLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [listVisibility, setListVisibility] = useState('collaborative');
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
        setGearLists(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching gear lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGearList = async () => {
    if (!newListTitle.trim()) {
      Alert.alert(t('oops'), t('pleaseEnterGearListTitle'));
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
        body: JSON.stringify({ 
          title: newListTitle.trim(),
          visibility: listVisibility
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewListTitle('');
        setListVisibility('collaborative');
        fetchGearLists();
        navigation.navigate('GearListDetail', {
          groupId,
          listId: data.list.id,
          listTitle: data.list.title,
          listVisibility: data.list.visibility,
        });
      } else {
        const error = await response.json();
        Alert.alert(t('oops'), error.error || t('failedToCreateGearList'));
      }
    } catch (error) {
      Alert.alert(t('oops'), t('failedToCreateGearList'));
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
          listVisibility: item.visibility,
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
          📦 {item.item_count || 0} {item.item_count === 1 ? t('item') : t('items')}
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
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ {t('newGearList')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowInfoModal(true)}
          >
            <Text style={styles.infoButtonText}>ℹ️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {gearLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎒</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noGearListsYet')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {t('createGearListToOrganize')}
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
              {t('createGearList')}
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
              placeholder={t('gearListTitleRequired')}
              placeholderTextColor={colors.textSecondary}
              value={newListTitle}
              onChangeText={setNewListTitle}
            />

            <View style={styles.visibilityToggle}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                {t('listType')}:
              </Text>
              <View style={styles.toggleButtons}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { borderColor: colors.border },
                    listVisibility === 'collaborative' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setListVisibility('collaborative')}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      { color: listVisibility === 'collaborative' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    👥 {t('collaborative')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    { borderColor: colors.border },
                    listVisibility === 'personal' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setListVisibility('personal')}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      { color: listVisibility === 'personal' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    👤 {t('personal')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewListTitle('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {t('cancel')}
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
                  {creating ? t('creating') : t('create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showInfoModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.infoModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoModalTitle, { color: colors.text }]}>
              📋 {t('aboutGearLists')}
            </Text>
            
            <Text style={[styles.infoModalText, { color: colors.textSecondary }]}>
              {t('gearListsDescription')}
            </Text>

            <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
              <Text style={[styles.infoSectionTitle, { color: colors.primary }]}>
                👥 {t('collaborativeListsTitle')}
              </Text>
              <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                {t('collaborativeListsDescription')}
              </Text>
            </View>

            <View style={[styles.infoSection, { backgroundColor: colors.background }]}>
              <Text style={[styles.infoSectionTitle, { color: colors.primary }]}>
                👤 {t('personalListsTitle')}
              </Text>
              <Text style={[styles.infoSectionText, { color: colors.textSecondary }]}>
                {t('personalListsDescription')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.infoCloseButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoCloseButtonText}>{t('gotIt')}</Text>
            </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  createButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 20,
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
    marginBottom: SPACING.md,
  },
  visibilityToggle: {
    marginBottom: SPACING.lg,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleButton: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
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
  infoModalContent: {
    width: '90%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
  },
  infoModalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  infoModalText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  infoSection: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  infoSectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  infoSectionText: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  infoCloseButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  infoCloseButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
