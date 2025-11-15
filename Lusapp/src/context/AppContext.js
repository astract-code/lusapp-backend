import { create } from 'zustand';
import { mockPosts } from '../data/mockPosts';
import { mockUsers } from '../data/mockUsers';
import { mockRaces } from '../data/mockRaces';

const USE_API = true;
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://lusapp-backend-1.onrender.com';

export const useAppStore = create((set, get) => ({
  races: [],
  posts: [],
  users: [],
  isLoading: false,
  
  fetchRaces: async () => {
    set({ isLoading: true });
    
    if (!USE_API) {
      console.log('Using mock race data (development mode)');
      set({ races: mockRaces, isLoading: false });
      return;
    }
    
    try {
      console.log('Fetching races from:', `${API_URL}/api/races`);
      const response = await fetch(`${API_URL}/api/races`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data type:', Array.isArray(data) ? 'array' : typeof data);
      
      if (!Array.isArray(data)) {
        console.error('API returned non-array data, falling back to mock data');
        set({ races: mockRaces, isLoading: false });
        return;
      }
      
      const formattedRaces = data.map(race => ({
        id: race.id.toString(),
        name: race.name,
        sport: race.sport,
        sport_category: race.sport_category,
        sport_subtype: race.sport_subtype,
        city: race.city,
        country: race.country,
        continent: race.continent,
        date: race.date.split('T')[0],
        start_time: race.start_time,
        distance: race.distance,
        description: race.description,
        participants: race.participants,
        registeredUsers: (race.registered_users || []).map(id => id.toString()),
      }));
      
      console.log(`Successfully loaded ${formattedRaces.length} races from API`);
      set({ races: formattedRaces, isLoading: false });
    } catch (error) {
      console.error('Error fetching races, using mock data:', error.message);
      set({ races: mockRaces, isLoading: false });
    }
  },
  
  addRace: (race) => set((state) => ({ races: [...state.races, race] })),
  
  registerForRace: (raceId, userId) => set((state) => ({
    races: state.races.map((race) =>
      race.id === raceId
        ? {
            ...race,
            registeredUsers: [...(race.registeredUsers || []), userId.toString()],
            participants: race.participants + 1,
          }
        : race
    ),
  })),
  
  unregisterFromRace: (raceId, userId) => set((state) => ({
    races: state.races.map((race) =>
      race.id === raceId
        ? {
            ...race,
            registeredUsers: (race.registeredUsers || []).filter(id => id !== userId.toString()),
            participants: Math.max(0, race.participants - 1),
          }
        : race
    ),
  })),
  
  toggleLikePost: (postId, userId) => set((state) => ({
    posts: state.posts.map((post) => {
      if (post.id !== postId) return post;
      
      const likedBy = post.likedBy || [];
      const hasLiked = likedBy.includes(userId);
      
      return {
        ...post,
        likedBy: hasLiked
          ? likedBy.filter(id => id !== userId)
          : [...likedBy, userId],
      };
    }),
  })),
  
  addComment: (postId, userId, text) => set((state) => ({
    posts: state.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [
              ...post.comments,
              { userId, text, timestamp: new Date().toISOString() },
            ],
          }
        : post
    ),
  })),
  
  getUserById: (userId) => {
    return get().users.find(user => user.id === userId);
  },
  
  getRaceById: (raceId) => {
    return get().races.find(race => race.id === raceId);
  },
  
  toggleFollow: (currentUserId, targetUserId) => {
    if (currentUserId === targetUserId) {
      return;
    }
    
    set((state) => ({
      users: state.users.map((user) => {
        if (user.id === currentUserId) {
          const isFollowing = user.following?.includes(targetUserId);
          return {
            ...user,
            following: isFollowing
              ? user.following.filter(id => id !== targetUserId)
              : [...(user.following || []), targetUserId],
          };
        }
        if (user.id === targetUserId) {
          const hasFollower = user.followers?.includes(currentUserId);
          return {
            ...user,
            followers: hasFollower
              ? user.followers.filter(id => id !== currentUserId)
              : [...(user.followers || []), currentUserId],
          };
        }
        return user;
      }),
    }));
  },
}));
