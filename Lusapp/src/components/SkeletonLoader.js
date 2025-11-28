import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SkeletonPulse = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        style,
        { opacity },
      ]}
    />
  );
};

export const RaceCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <SkeletonPulse style={styles.iconSkeleton} />
          <View style={styles.titleContainer}>
            <SkeletonPulse style={styles.titleSkeleton} />
            <SkeletonPulse style={styles.subtitleSkeleton} />
          </View>
        </View>
        <SkeletonPulse style={styles.badgeSkeleton} />
      </View>
      <SkeletonPulse style={styles.locationSkeleton} />
      <View style={styles.footer}>
        <SkeletonPulse style={styles.dateSkeleton} />
        <SkeletonPulse style={styles.participantsSkeleton} />
      </View>
    </View>
  );
};

export const ProfileSkeleton = () => {
  return (
    <View style={styles.profileContainer}>
      <SkeletonPulse style={styles.avatarSkeleton} />
      <SkeletonPulse style={styles.nameSkeleton} />
      <SkeletonPulse style={styles.bioSkeleton} />
      <View style={styles.statsRow}>
        <SkeletonPulse style={styles.statSkeleton} />
        <SkeletonPulse style={styles.statSkeleton} />
        <SkeletonPulse style={styles.statSkeleton} />
      </View>
    </View>
  );
};

export const ListSkeleton = ({ count = 3 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <RaceCardSkeleton key={index} />
      ))}
    </View>
  );
};

export const FeedPostSkeleton = () => {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <SkeletonPulse style={styles.postAvatarSkeleton} />
        <View style={styles.postHeaderText}>
          <SkeletonPulse style={styles.postNameSkeleton} />
          <SkeletonPulse style={styles.postTimeSkeleton} />
        </View>
      </View>
      <SkeletonPulse style={styles.postContentSkeleton} />
      <SkeletonPulse style={styles.postContentSkeleton2} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  iconSkeleton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleSkeleton: {
    height: 18,
    width: '80%',
    marginBottom: 6,
    borderRadius: 4,
  },
  subtitleSkeleton: {
    height: 13,
    width: '50%',
    borderRadius: 4,
  },
  badgeSkeleton: {
    width: 60,
    height: 28,
    borderRadius: 20,
  },
  locationSkeleton: {
    height: 14,
    width: '60%',
    marginBottom: 10,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateSkeleton: {
    height: 14,
    width: 120,
    borderRadius: 4,
  },
  participantsSkeleton: {
    height: 14,
    width: 50,
    borderRadius: 4,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
  },
  avatarSkeleton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  nameSkeleton: {
    height: 24,
    width: 150,
    marginBottom: 8,
    borderRadius: 4,
  },
  bioSkeleton: {
    height: 14,
    width: 200,
    marginBottom: 20,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statSkeleton: {
    width: 60,
    height: 40,
    borderRadius: 8,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatarSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  postHeaderText: {
    flex: 1,
  },
  postNameSkeleton: {
    height: 16,
    width: 120,
    marginBottom: 6,
    borderRadius: 4,
  },
  postTimeSkeleton: {
    height: 12,
    width: 80,
    borderRadius: 4,
  },
  postContentSkeleton: {
    height: 14,
    width: '100%',
    marginBottom: 8,
    borderRadius: 4,
  },
  postContentSkeleton2: {
    height: 14,
    width: '70%',
    borderRadius: 4,
  },
});
