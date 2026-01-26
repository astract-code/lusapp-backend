import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from '../components/PostCard';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import API_URL from '../config/api';
import { fetchWithAuth } from '../utils/apiClient';

export const FeedScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/posts/feed`);

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/auth/users/suggested`);

      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.users || []);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchSuggestedUsers();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed();
    fetchSuggestedUsers();
  }, []);

  const handlePostUpdate = useCallback((postId, updates) => {
    setPosts(currentPosts => 
      currentPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleRacePress = (raceId) => {
    navigation.navigate('RaceDetail', { raceId });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onUserPress={handleUserPress}
            onRacePress={handleRacePress}
            onPostUpdate={handlePostUpdate}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.header, { color: colors.text }]}>
            Activity Feed
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No posts yet. Follow athletes to see their activity!
            </Text>
            
            {suggestedUsers.length > 0 && (
              <View style={styles.suggestedSection}>
                <Text style={[styles.suggestedTitle, { color: colors.text }]}>
                  Suggested Athletes
                </Text>
                {suggestedUsers.slice(0, 5).map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.suggestedUser, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                  >
                    <UserAvatar uri={user.avatar} size={50} />
                    <View style={styles.suggestedUserInfo}>
                      <Text style={[styles.suggestedUserName, { color: colors.text }]}>
                        {user.name}
                      </Text>
                      {user.location && (
                        <Text style={[styles.suggestedUserLocation, { color: colors.textSecondary }]}>
                          {user.location}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.viewButton, { backgroundColor: colors.primary }]}>
                      <Text style={styles.viewButtonText}>View</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.md,
  },
  header: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  emptyContainer: {
    paddingVertical: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  suggestedSection: {
    marginTop: SPACING.md,
  },
  suggestedTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  suggestedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  suggestedUserInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  suggestedUserName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  suggestedUserLocation: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  viewButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
