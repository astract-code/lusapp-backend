import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

import { FeedScreen } from '../screens/FeedScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RaceDetailScreen } from '../screens/RaceDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { GearListDetailScreen } from '../screens/GearListDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const FeedStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="FeedMain" 
        component={FeedScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RaceDetail" 
        component={RaceDetailScreen}
        options={{ title: 'Race Details' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

const CalendarStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="CalendarMain" 
        component={CalendarScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RaceDetail" 
        component={RaceDetailScreen}
        options={{ title: 'Race Details' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

const DiscoverStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="DiscoverMain" 
        component={DiscoverScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RaceDetail" 
        component={RaceDetailScreen}
        options={{ title: 'Race Details' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

const MessagesStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="MessagesMain" 
        component={MessagesScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RaceDetail" 
        component={RaceDetailScreen}
        options={{ title: 'Race Details' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const GroupsStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="GroupsMain" 
        component={GroupsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GroupDetail" 
        component={GroupDetailScreen}
        options={{ title: 'Group Details' }}
      />
      <Stack.Screen 
        name="GearListDetail" 
        component={GearListDetailScreen}
        options={{ title: 'Gear List' }}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;
  const { token } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadGroups, setUnreadGroups] = useState(0);

  const fetchUnreadCounts = async () => {
    if (!token) return;

    try {
      // Fetch both unread counts in parallel for better performance
      const [messagesResponse, groupsResponse] = await Promise.all([
        fetch(`${API_URL}/api/messages/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/groups/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
      ]);

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setUnreadMessages(messagesData.count || 0);
      }

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setUnreadGroups(groupsData.count || 0);
      }
    } catch (error) {
      // Silently fail - unread counts are non-critical
      // Just keep badges at 0 if network fails
    }
  };

  // Poll for unread counts every 5 seconds
  useEffect(() => {
    if (!token) return;

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedStack}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color, fontWeight: '300' }}>≡</Text>,
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color, fontWeight: '300' }}>▦</Text>,
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStack}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color, fontWeight: '300' }}>◉</Text>,
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStack}
        options={{
          tabBarLabel: 'Groups',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color, fontWeight: '300' }}>◈</Text>,
          tabBarBadge: unreadGroups > 0 ? unreadGroups : undefined,
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color, fontWeight: '300' }}>◐</Text>,
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color, fontWeight: '300' }}>◯</Text>,
        }}
      />
    </Tab.Navigator>
  );
};
