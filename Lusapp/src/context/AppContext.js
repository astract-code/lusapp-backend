import { create } from 'zustand';
import { mockPosts } from '../data/mockPosts';
import { mockUsers } from '../data/mockUsers';

const API_URL = `https://${process.env.REPLIT_DEV_DOMAIN || '9f3814b8-ecc1-421a-88c5-74001ee67b54-00-r9w1zdd6rpvt.worf.replit.dev'}`;

export const useAppStore = create((set, get) => ({
  races: [],
  posts: mockPosts,
  users: mockUsers,
  isLoading: false,
  
  fetchRaces: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching races from:', `${API_URL}/api/races`);
      const response = await fetch(`${API_URL}/api/races`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Data is not an array:', data);
        set({ isLoading: false });
        return;
      }
      
      const formattedRaces = data.map(race => ({
        id: race.id.toString(),
        name: race.name,
        sport: race.sport,
        city: race.city,
        country: race.country,
        continent: race.continent,
        date: race.date.split('T')[0],
        distance: race.distance,
        description: race.description,
        participants: race.participants,
        registeredUsers: [],
      }));
      
      console.log(`Successfully loaded ${formattedRaces.length} races`);
      set({ races: formattedRaces, isLoading: false });
    } catch (error) {
      console.error('Error fetching races:', error.message);
      set({ isLoading: false, races: [] });
    }
  },
  
  addRace: (race) => set((state) => ({ races: [...state.races, race] })),
  
  registerForRace: (raceId, userId) => set((state) => ({
    races: state.races.map((race) =>
      race.id === raceId
        ? {
            ...race,
            registeredUsers: [...(race.registeredUsers || []), userId],
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
            registeredUsers: (race.registeredUsers || []).filter(id => id !== userId),
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
}));
