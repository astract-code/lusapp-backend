import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BORDER_RADIUS } from '../constants/theme';

export const UserAvatar = ({ uri, size = 40, onPress }) => {
  if (!uri) {
    return null;
  }

  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container onPress={onPress} style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});
