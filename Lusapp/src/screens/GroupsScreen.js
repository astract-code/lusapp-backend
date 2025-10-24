import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const GroupsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('my');
  const [myGroups, setMyGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [joinPassword, setJoinPassword] = useState('');
  
  const [newGroup, setNewGroup] = useState({
    name: '',
    sport_type: '',
    city: '',
    country: '',
    description: '',
    password: ''
  });

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyGroups();
    } else {
      searchGroups();
    }
  }, [activeTab]);

  const fetchMyGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/groups/my-groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGroups = async () => {
    try {
      setLoading(true);
      const params = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`${API_URL}/api/groups/search${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGroup)
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateModal(false);
        setNewGroup({ name: '', sport_type: '', city: '', country: '', description: '', password: '' });
        fetchMyGroups();
        setActiveTab('my');
        navigation.navigate('GroupDetail', { groupId: data.group.id });
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to create group');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const joinGroup = async (groupId, hasPassword) => {
    if (hasPassword) {
      setSelectedGroup(groupId);
      setShowJoinModal(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        Alert.alert('Success', 'Joined group successfully');
        searchGroups();
        fetchMyGroups();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to join group');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const submitJoinWithPassword = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${selectedGroup}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: joinPassword })
      });

      if (response.ok) {
        setShowJoinModal(false);
        setJoinPassword('');
        setSelectedGroup(null);
        Alert.alert('Success', 'Joined group successfully');
        searchGroups();
        fetchMyGroups();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Incorrect password');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const renderGroupCard = ({ item }) => {
    const isMyGroup = item.user_role;
    
    return (
      <TouchableOpacity
        style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => isMyGroup ? navigation.navigate('GroupDetail', { groupId: item.id }) : null}
      >
        <View style={styles.groupHeader}>
          <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
          {item.has_password && <Text style={styles.lockIcon}>🔒</Text>}
        </View>
        
        {item.sport_type && (
          <Text style={[styles.groupSport, { color: colors.textSecondary }]}>
            {item.sport_type}
          </Text>
        )}
        
        {item.city && (
          <Text style={[styles.groupLocation, { color: colors.textSecondary }]}>
            📍 {item.city}{item.country ? `, ${item.country}` : ''}
          </Text>
        )}
        
        {item.description && (
          <Text style={[styles.groupDescription, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.groupFooter}>
          <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
            👥 {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
          </Text>
          
          {!isMyGroup ? (
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: colors.primary }]}
              onPress={() => joinGroup(item.id, item.has_password)}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {item.role?.toUpperCase()}
            </Text>
          )}
        </View>

        {isMyGroup && item.unread_count > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Groups</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'my' ? colors.primary : colors.textSecondary }]}>
            My Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'discover' ? colors.primary : colors.textSecondary }]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'discover' && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search groups..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchGroups}
          />
        </View>
      )}

      <FlatList
        data={activeTab === 'my' ? myGroups : searchResults}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={activeTab === 'my' ? fetchMyGroups : searchGroups}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeTab === 'my' ? 'No groups yet. Create or join one!' : 'No groups found'}
          </Text>
        }
      />

      <Modal visible={showCreateModal} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Group</Text>
            
            <ScrollView 
              style={styles.modalScrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Group Name *"
              placeholderTextColor={colors.textSecondary}
              value={newGroup.name}
              onChangeText={(text) => setNewGroup({ ...newGroup, name: text })}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Sport Type (e.g., Marathon, Triathlon)"
              placeholderTextColor={colors.textSecondary}
              value={newGroup.sport_type}
              onChangeText={(text) => setNewGroup({ ...newGroup, sport_type: text })}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="City"
              placeholderTextColor={colors.textSecondary}
              value={newGroup.city}
              onChangeText={(text) => setNewGroup({ ...newGroup, city: text })}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Country"
              placeholderTextColor={colors.textSecondary}
              value={newGroup.country}
              onChangeText={(text) => setNewGroup({ ...newGroup, country: text })}
            />
            
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={newGroup.description}
              onChangeText={(text) => setNewGroup({ ...newGroup, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Password (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newGroup.password}
              onChangeText={(text) => setNewGroup({ ...newGroup, password: text })}
              secureTextEntry
            />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewGroup({ name: '', sport_type: '', city: '', country: '', description: '', password: '' });
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={createGroup}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showJoinModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Password</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Group Password"
              placeholderTextColor={colors.textSecondary}
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinPassword('');
                  setSelectedGroup(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={submitJoinWithPassword}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Join</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  list: {
    padding: SPACING.md,
  },
  groupCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    position: 'relative',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  groupName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    flex: 1,
  },
  lockIcon: {
    fontSize: 16,
    marginLeft: SPACING.xs,
  },
  groupSport: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  groupLocation: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  groupDescription: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: FONT_SIZE.sm,
  },
  joinButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  roleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.xxl,
    fontSize: FONT_SIZE.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  modalButtonText: {
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
});
