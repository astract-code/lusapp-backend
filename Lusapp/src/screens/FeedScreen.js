import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCard } from '../components/PostCard';
import { useAppStore } from '../context/AppContext';
import { COLORS, SPACING, FONT_SIZE } from '../constants/theme';

export const FeedScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;
  const posts = useAppStore((state) => state.posts);

  const sortedPosts = useMemo(() => 
    [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [posts]
  );

  const handleUserPress = (userId) => {
    navigation.navigate('UserProfile', { userId });
  };

  const handleRacePress = (raceId) => {
    navigation.navigate('RaceDetail', { raceId });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={sortedPosts}
        keyExtractor={(item) => item.id}
        extraData={posts}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onUserPress={handleUserPress}
            onRacePress={handleRacePress}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.header, { color: theme.text }]}>
            Activity Feed
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: SPACING.md,
  },
  header: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
});
