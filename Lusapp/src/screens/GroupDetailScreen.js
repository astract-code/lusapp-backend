import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { GroupChatTab } from './GroupChatTab';
import { GroupMembersTab } from './GroupMembersTab';
import { GroupGearListsTab } from './GroupGearListsTab';

import API_URL from '../config/api';

export const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('chat');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(data);
        navigation.setOptions({ title: data.name });
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      t('leaveGroup'),
      t('leaveGroupConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('leave'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/groups/${groupId}/leave`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert(t('success'), t('youHaveLeftTheGroup'));
                navigation.goBack();
              } else {
                const error = await response.json();
                Alert.alert(t('oops'), error.error || t('failedToLeaveGroup'));
              }
            } catch (error) {
              Alert.alert(t('oops'), t('failedToLeaveGroup'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      t('deleteGroup'),
      t('deleteGroupConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert(t('success'), t('groupDeletedSuccessfully'));
                navigation.navigate('GroupsMain');
              } else {
                const error = await response.json();
                Alert.alert(t('oops'), error.error || t('failedToDeleteGroup'));
              }
            } catch (error) {
              Alert.alert(t('oops'), t('failedToDeleteGroup'));
            }
          },
        },
      ]
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

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('groupNotFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = group.user_role === 'owner';

  const hideHeader = keyboardVisible && activeTab === 'chat';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!hideHeader && (
          <ScrollView style={styles.header}>
            <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
            {group.sport_type && (
              <Text style={[styles.sportType, { color: colors.textSecondary }]}>
                {group.sport_type}
              </Text>
            )}
            {group.description && (
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {group.description}
              </Text>
            )}
            <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
              👥 {group.member_count} {group.member_count === 1 ? t('member') : t('members')}
            </Text>
            
            {isOwner ? (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: '#d32f2f' }]}
                onPress={handleDeleteGroup}
              >
                <Text style={styles.deleteButtonText}>{t('deleteGroup')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.leaveButton, { backgroundColor: colors.error }]}
                onPress={handleLeaveGroup}
              >
                <Text style={styles.leaveButtonText}>{t('leaveGroup')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'chat' && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab('chat')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'chat' ? colors.primary : colors.textSecondary },
              ]}
            >
              {t('chat')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'members' && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab('members')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'members' ? colors.primary : colors.textSecondary },
              ]}
            >
              {t('members')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'gear' && { borderBottomColor: colors.primary },
            ]}
            onPress={() => setActiveTab('gear')}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'gear' ? colors.primary : colors.textSecondary },
              ]}
            >
              {t('gearLists')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'chat' && <GroupChatTab groupId={groupId} />}
          {activeTab === 'members' && <GroupMembersTab groupId={groupId} />}
          {activeTab === 'gear' && (
            <GroupGearListsTab
              groupId={groupId}
              navigation={navigation}
              userRole={group.user_role}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
  },
  header: {
    padding: SPACING.lg,
    maxHeight: 200,
  },
  groupName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  sportType: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
  },
  memberCount: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  leaveButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  deleteButton: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
});
