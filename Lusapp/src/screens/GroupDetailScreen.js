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
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { GroupChatTab } from './GroupChatTab';
import { GroupMembersTab } from './GroupMembersTab';
import { GroupGearListsTab } from './GroupGearListsTab';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

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
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
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
                Alert.alert('Success', 'You have left the group');
                navigation.goBack();
              } else {
                const error = await response.json();
                Alert.alert('Error', error.error || 'Failed to leave group');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to leave group');
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
            Group not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = group.user_role === 'owner';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          👥 {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
        </Text>
        
        {!isOwner && (
          <TouchableOpacity
            style={[styles.leaveButton, { backgroundColor: colors.error }]}
            onPress={handleLeaveGroup}
          >
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
            Chat
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
            Members
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
            Gear Lists
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
