import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/theme';

import { FeedScreen } from '../screens/FeedScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RaceDetailScreen } from '../screens/RaceDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';

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
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme] || COLORS.light;

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
          tabBarIcon: ({ color }) => <text style={{ fontSize: 24 }}>📰</text>,
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarStack}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color }) => <text style={{ fontSize: 24 }}>📅</text>,
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverStack}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => <text style={{ fontSize: 24 }}>🔍</text>,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <text style={{ fontSize: 24 }}>👤</text>,
        }}
      />
    </Tab.Navigator>
  );
};
