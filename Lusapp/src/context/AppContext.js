import { create } from 'zustand';
import { mockRaces } from '../data/mockRaces';
import { mockPosts } from '../data/mockPosts';
import { mockUsers } from '../data/mockUsers';

export const useAppStore = create((set, get) => ({
  races: mockRaces,
  posts: mockPosts,
  users: mockUsers,
  
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
    posts: state.posts.map((post) =>
      post.id === postId
        ? { ...post, likes: post.likes + (post.liked ? -1 : 1), liked: !post.liked }
        : post
    ),
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
