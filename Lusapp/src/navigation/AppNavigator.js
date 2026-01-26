import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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

const screenOptions = {
  animation: 'slide_from_right',
  animationDuration: 250,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
};

const FeedStack = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
        ...screenOptions,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
        ...screenOptions,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
        ...screenOptions,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
        ...screenOptions,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
        ...screenOptions,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
        options={({ navigation }) => ({ 
          title: 'Group Details',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              navigation.navigate('GroupsMain');
            }}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.primary}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="GearListDetail" 
        component={GearListDetailScreen}
        options={({ navigation }) => ({ 
          title: 'Gear List',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('GroupsMain');
              }
            }}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.primary}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen}
        options={({ navigation }) => ({ 
          title: 'Profile',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('GroupsMain');
              }
            }}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.primary}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={({ navigation }) => ({ 
          title: 'Chat',
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('GroupsMain');
              }
            }}>
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.primary}
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          ),
        })}
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

  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#0B0F1A' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
          paddingBottom: 10,
          paddingTop: 10,
          height: 75,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: '#4ADE80',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
          tabBarBadge: unreadGroups > 0 ? unreadGroups : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            fontSize: 10,
            minWidth: 18,
            height: 18,
          },
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
