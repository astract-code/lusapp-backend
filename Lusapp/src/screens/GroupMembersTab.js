import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

import API_URL from '../config/api';

export const GroupMembersTab = ({ groupId }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const fetchMembers = async () => {
    try {
      console.log('=== FETCHING MEMBERS ===');
      console.log('API URL:', API_URL);
      console.log('Group ID:', groupId);
      console.log('Full URL:', `${API_URL}/api/groups/${groupId}/members`);
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Members data:', JSON.stringify(data, null, 2));
        console.log('Members array:', data.members);
        console.log('Members count:', data.members?.length || 0);
        setMembers(data.members || []);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return colors.primary;
      case 'moderator':
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  const renderMember = ({ item }) => (
    <View style={[styles.memberItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.border }]}>
            <Text style={[styles.avatarPlaceholder, { color: colors.textSecondary }]}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
        {item.location && (
          <Text style={[styles.memberLocation, { color: colors.textSecondary }]}>
            📍 {item.location}
          </Text>
        )}
      </View>
      <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
        <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
      </View>
    </View>
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
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No members found
          </Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.user_id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
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
    textAlign: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  memberItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  memberLocation: {
    fontSize: FONT_SIZE.sm,
  },
  roleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
  },
});
